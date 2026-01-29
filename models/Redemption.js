import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: {
      type: Number,
    },

    accountDetails: {
      accountHolderName: { type: String, },
      bankName: { type: String, },
      accountNumber: { type: String, },
      ifscCode: { type: String, }
    },

    upiId: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Redemption", redemptionSchema);
