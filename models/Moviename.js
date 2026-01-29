import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    MovieName: {
      type: String,
    },
    image: {
      type: String, // image URL / path
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Moviename", movieSchema);
