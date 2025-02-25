process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const adminRoutes = require("./Routes/adminRoute");
const fileRoutes = require("./Routes/fileRoute");
const notificationRoutes = require("./Routes/NotificationRoute");
require("dotenv").config();
require("./config/databaseConnection");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

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
      scope: ['r_liteprofile', 'r_emailaddress']
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
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
app.disable("etag");

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:5173/auth/google/callback?token=${token}`);

    res.send(`
      <script type="text/javascript">
        window.opener.postMessage({ token: '${token}' }, '*');
        window.close();
      </script>
    `);
  }
);

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:5173/auth/linkedin/callback?token=${token}`);
  }
);

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
