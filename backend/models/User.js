import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 30,
    required: function () {
      return !this.googleId; // Username only required for normal users
    },
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  password: {
    type: String,
    minlength: 6,
    required: function () {
      return !this.googleId; // Password only required for normal users
    },
  },

  googleId: {
    type: String,
    default: null,
  },

  picture: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
