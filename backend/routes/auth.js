import express from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { authMiddleware as verifyToken } from '../middleware/authMiddleware.js';
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import "../passportConfig.js";   // ⭐ REQUIRED so Google Strategy loads

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, profile);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/me", verifyToken, (req, res) => {
  res.json({
    user: req.user
  });
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {

    // 🔴 User not registered → go to signup (empty page)
    if (req.user.isNewUser) {
      return res.redirect("http://localhost:5173/signup");
    }

    // 🟢 User exists → login
    const token = jwt.sign(
      { id: req.user.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.redirect(
      `http://localhost:5173/auth/google/callback?token=${token}`
    );
  }
);


export default router;
