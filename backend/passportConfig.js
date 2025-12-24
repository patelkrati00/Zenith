import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        const user = await User.findOne({ email });

        if (!user) {
          // 🔴 Not registered yet (login flow)
          return done(null, {
            isNewUser: true,
            profile, // ✅ REQUIRED
          });
        }

        // 🟢 Already registered
        return done(null, {
          isNewUser: false,
          user,
          profile, // ✅ still pass profile
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Optional debug (safe)
if (process.env.NODE_ENV !== "production") {
  console.log("GOOGLE CLIENT ID LOADED");
}
