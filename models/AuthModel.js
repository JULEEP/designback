import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String, },
    lastName: { type: String, },
    fullName: { type: String },
    email: { type: String, },
    phoneNumber: { type: String, unique: true },
    password: { type: String },
    // inside your User schema
    profileImage: { type: String, default: null },
    profileImageId: { type: String, default: null }, // cloudinary public_id


    // REFERRAL SYSTEM
    referralCode: { type: String, unique: true },   // Auto generated for each user
    usedReferralCode: { type: String },             // Which referral code user entered
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who referred user
    referralCount: { type: Number, default: 0 },     // How many users he referred
    notifications: [
  {
    type: { 
      type: String, 
      enum: ["order", "general"], 
    },

    // ✅ NEW FIELDS
    MovieName: { type: String },
    ticketImage: { type: String },

    message: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }
],


 wallet: {
      balance: { type: Number, default: 0 }, 
      history: [
        {
          orderId: { type: mongoose.Schema.Types.ObjectId, ref: "CreateMovieTicket" },
          amount: { type: Number, required: true },
          ticketDetails: { type: Object },
          addedAt: { type: Date, default: Date.now }
        }
      ]
    },

}, { timestamps: true });

export default mongoose.model("User", userSchema);
