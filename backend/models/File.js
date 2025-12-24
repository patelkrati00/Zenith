import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },

    type: {
      type: String,
      required: true,
      enum: ["file", "folder"],
    },
  },
  { timestamps: true }
);

fileSchema.index({ project: 1, parent: 1, name: 1 }, { unique: true });

const File = mongoose.model("File", fileSchema);
export default File;
