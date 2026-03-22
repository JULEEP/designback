// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String,},
    lastName: { type: String, },
    fullName: { type: String },
    email: { type: String,  },
    phoneNumber: { type: String, },
    password: { type: String, },
    address: { type: String, default: "" },
    
    // Profile Image
    profileImage: { type: String, default: null },
    profileImageId: { type: String, default: null },

    // Account Status
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    
}, { timestamps: true });

// Generate full name before saving
userSchema.pre('save', function(next) {
    if (this.firstName && this.lastName) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});

export default mongoose.model("User", userSchema);