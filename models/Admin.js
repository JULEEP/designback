import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
    },
    mobile: {
      type: String,
      unique: true,
    },
    profileImage: {
      type: String,  // Store the image URL
      default: "",
    },

    // ✅ Structured notifications array
    notifications: [
      {
        message: { type: String, required: true },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "CreateMovieTicket" },
        status: { type: String, enum: ["created", "updated", "cancelled", "deleted"], default: "created" },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
