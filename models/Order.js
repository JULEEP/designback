import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", },

    tickets: [
      {
        ticket: {
          ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "CreateMovieTicket", },
          MovieName: String,
          showDate: Date,
          showTime: String,
          ticketCategory: String,
          selectedSeats: [String],
          purchasedSeats: {
            type: [String],
            default: []
          },
          pricePerTicket: Number,
          totalPrice: Number,
          platformCharge: { type: Number, },  // Added platformCharge
          gst: { type: Number, },  // Added gst
          totalAmountWithCharges: { type: Number, },  // Total after adding charges
          ticketImage: String,
          quantity: { type: Number, default: 1 },
          soldCount: { type: Number, default: 0 },
          remainingCount: { type: Number, default: 0 },
          language: String,
          theatrePlace: String,
          qrCodeLink: String,
          ticketType: String,
          screen: String,
          qrCode: String,
          status: String
        },
        movie: {
          movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Moviename" },
          MovieName: String,
          image: String,
          createdAt: Date,
          updatedAt: Date
        }
      }
    ],

    totalAmount: { type: Number, },
    transactionId: { type: String, },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    razorpayStatus: { type: String, enum: ["created", "authorized", "captured", "failed"], default: "created" },
    orderStatus: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    // ✅ New field
    isReported: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
