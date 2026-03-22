import mongoose from "mongoose";

const billBookSchema = new mongoose.Schema(
  {
    name: { type: String },
    file: { type: String },           // Edited image (with text)
    originalFile: { type: String },    // New field - Original image (without text)
    textElements: { type: Array, default: [] },
    isEdited: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("BillBook", billBookSchema);