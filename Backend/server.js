const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
const CourseEnrollment = require("./models/CourseEnrollment");
const DiscussionMessage = require("./models/DiscussionMessage");
const adminRoutes = require("./Routes/adminRoute");
const eventsRoutes = require("./Routes/eventsRoute");
const fileRoutes = require("./Routes/fileRoute");
const notificationRoutes = require("./Routes/NotificationRoute");
const coursesRoutes = require("./Routes/CoursesRoute");
const groupeRoutes = require("./Routes/GestionGroupeRoute");
const GestionRecruitementRoute = require("./Routes/GestionRecruitementRoute");
const tutorialRoutes = require("./Routes/tutorialRoute");
const chatRoutes = require("./Routes/chatRoute");

const User = require("./models/User");
const { default: axios } = require("axios");
require("dotenv").config({ path: __dirname + "/.env" });
require("./config/databaseConnection");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});


if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  console.warn("Warning: Using fallback JWT_SECRET. Please set JWT_SECRET in your .env file.");
}

console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("AZURE_TTS_KEY:", process.env.AZURE_TTS_KEY);
console.log("AZURE_TTS_REGION:", process.env.AZURE_TTS_REGION);
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);


app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);



app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
  limit: "50mb",
  extended: true,
  parameterLimit: 50000
}));


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

if (process.env.NODE_ENV === "test") {
  app.use((req, res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011" };
    next();
  });
}

// Passport Strategies
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile) {
          return done(new Error("Profile fetch failed"));
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
            displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`.trim(),
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/linkedin-callback",
      scope: ["openid", "profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
        console.log("Profile:", profile);

        if (!profile) {
          return done(new Error("Profile fetch failed"));
        }

        let user = await User.findOne({ linkedinId: profile.id });
        if (!user) {
          user = await User.create({
            linkedinId: profile.id,
            email: profile.emails?.[0]?.value || null,
            displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`.trim(),
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinCourseDiscussion", async ({ courseId, userId }) => {
    try {
      const enrollment = await CourseEnrollment.findOne({ userId, courseId });
      if (!enrollment) {
        socket.emit("error", { message: "You must be enrolled to join the discussion" });
        return;
      }

      socket.join(courseId);
      console.log(`User ${userId} joined course ${courseId} discussion`);
    } catch (error) {
      socket.emit("error", { message: "Error joining discussion" });
    }
  });

  socket.on("sendMessage", async ({ courseId, userId, content }) => {
    try {
      const enrollment = await CourseEnrollment.findOne({ userId, courseId });
      if (!enrollment) {
        socket.emit("error", { message: "You must be enrolled to send messages" });
        return;
      }

      const contentLower = content.toLowerCase();
      const badWords = ["badword1", "badword2", "rasist", "inappropriate"];
      const containsBadWord = badWords.some((word) => contentLower.includes(word.toLowerCase()));
      if (containsBadWord) {
        socket.emit("error", { message: "Message contains inappropriate words" });
        return;
      }

      const message = new DiscussionMessage({ courseId, userId, content });
      await message.save();

      const populatedMessage = await DiscussionMessage.findById(message._id).populate("userId", "username");
      
      io.to(courseId).emit("newMessage", populatedMessage);
    } catch (error) {
      socket.emit("error", { message: "Error sending message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes

app.use("/api/users", require("./Routes/UserRoute"));
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/recruitment", GestionRecruitementRoute);
app.use("/api/groups", groupeRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api", chatRoutes);

app.use("/uploads", express.static("Uploads"));

app.disable("etag");

// Authentication Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/login" }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`http://localhost:5173/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect("http://localhost:5173/login?error=auth_failed");
    }
  }
);

app.post("/generate-our-images-brotha", async (req, res) => {
  const { text_prompts, cfg_scale, sampler, seed, steps } = req.body;

  if (!text_prompts || !text_prompts[0]?.text) {
    return res.status(400).json({ message: "Text prompt is required" });
  }

  try {
    const nvidiaApiUrl = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl";
    const response = await axios.post(
      nvidiaApiUrl,
      {
        text_prompts,
        cfg_scale,
        sampler,
        seed,
        steps,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Log the response for debugging
    console.log("NVIDIA API Response:", response.data);

    let imageData;
    if (response.data?.artifacts?.[0]?.base64) {
      imageData = response.data.artifacts[0].base64;
    } else if (response.data?.image) {
      imageData = response.data.image;
    } else {
      throw new Error("Unexpected response format from NVIDIA API");
    }

    if (!imageData) {
      throw new Error("No image data received from API");
    }

    res.status(200).json({ image: imageData });
  } catch (error) {
    console.error("Image generation error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to generate image",
      error: error.response?.data?.message || error.message,
    });
  }
});


app.get("/auth/linkedin", require("./Controllers/UserController").linkedinLogin);
app.get("/linkedin-callback", require("./Controllers/UserController").linkedinCallback);

// Token Generation Function
function generateToken(user) {
  if (!user || !user.id) {
    throw new Error("User or user ID not provided for token generation");
  }
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Start the server (only if not in a test environment)
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };