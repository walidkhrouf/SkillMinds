const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser"); 
const adminRoutes = require("./Routes/adminRoute");
const fileRoutes = require("./Routes/fileRoute");
const eventsRoutes = require('./Routes/eventsRoute');
const notificationRoutes = require("./Routes/NotificationRoute");
require("dotenv").config();
require("./config/databaseConnection");

const app = express();

app.use(morgan("dev"));
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(cookieParser()); 
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5173/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);


passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/linkedin-callback",
      scope: ['openid', 'profile', 'email'],
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);
      console.log('Profile:', profile);
      if (!profile) {
        return done(new Error('Profile fetch failed'));
      }
      const linkedinUser = {
        id: profile.id,
        displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`.trim(),
        email: profile.emails?.[0]?.value || null,
      };
      return done(null, linkedinUser);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use("/api/users", require("./Routes/UserRoute"));
app.use("/api/admin", adminRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventsRoutes);
app.use("/uploads", express.static("uploads"));

app.disable("etag");

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:5173/auth/google/callback?token=${token}`);

    res.send(`
      <script type="javascript">
        window.opener.postMessage({ token: '${token}' }, '*');
        window.close();
      </script>
    `);
  }
);

app.get('/auth/linkedin', require('./Controllers/UserController').linkedinLogin);
app.get('/linkedin-callback', require('./Controllers/UserController').linkedinCallback);

function generateToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("******************************************");
  console.log(`Express server running on port ${PORT}`);
  console.log("******************************************");
  console.log("User routes loaded");
});