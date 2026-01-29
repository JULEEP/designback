import mongoose from "mongoose";

const platformChargeSchema = new mongoose.Schema({
  platformCharge: { type: Number, }, // store as percentage or fixed value
}, { timestamps: true });

export default mongoose.model("PlatformCharge", platformChargeSchema);
