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

    console.log("GOOGLE CALLBACK USER:", req.user);

    // 🔴 CASE 1: User NOT registered
    if (req.user.isNewUser) {
      return res.redirect(
    `http://localhost:5173/signup?email=${encodeURIComponent(req.user.email)}&name=${encodeURIComponent(req.user.name)}&googleId=${req.user.googleId}&picture=${encodeURIComponent(req.user.picture)}`
  );
}


    // ✅ CASE 2: User exists in DB
    const dbUser = req.user.user;

    const token = jwt.sign(
      {
        id: dbUser._id,
        name: dbUser.username,
        email: dbUser.email,
        picture: dbUser.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.redirect(
      `http://localhost:5173/auth/google/callback?token=${token}`
    );
  }
);

export default router;
