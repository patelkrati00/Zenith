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
          // user NOT registered
          return done(null, { isNewUser: true });
        }

        // user already registered
        return done(null, { isNewUser: false, user });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

console.log("GOOGLE CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE CLIENT SECRET:", process.env.GOOGLE_CLIENT_SECRET);
