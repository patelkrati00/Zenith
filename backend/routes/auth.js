import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import User from "../models/User.js";
import { register, login, profile } from "../controllers/authController.js";
import { authMiddleware as verifyToken } from "../middleware/authMiddleware.js";

import "../passportConfig.js";

dotenv.config();

const router = express.Router();

/* =====================
   MANUAL AUTH
===================== */
router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, profile);

router.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

/* =====================
   GOOGLE LOGIN (CHECK ONLY)
===================== */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "login"
  })
);

/* =====================
   GOOGLE SIGNUP ENTRY
===================== */
router.get(
  "/google-signup",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "signup"
  })
);

/* =====================
   GOOGLE CALLBACK (LOGIN OR SIGNUP)
===================== */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const { profile, user } = req.user;
      const flow = req.query.state; // 🔥 login OR signup

      // 🔴 LOGIN FLOW
      if (flow === "login" && !user) {
        return res.redirect("http://localhost:5173/signup");
      }

      let finalUser = user;

      // 🟢 SIGNUP FLOW → CREATE USER
      if (flow === "signup") {
        const email = profile.emails[0].value;

        finalUser = await User.findOne({ email });

        if (!finalUser) {
          finalUser = await User.create({
            username: profile.displayName,
            email,
            googleId: profile.id,
          });
        }
      }

      const token = jwt.sign(
        { id: finalUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.redirect(
        `http://localhost:5173/auth/google/callback?token=${token}`
      );
    } catch (err) {
      console.error("Google callback error:", err);
      return res.redirect("http://localhost:5173/signup");
    }
  }
);

export default router;
