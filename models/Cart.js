import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },

    tickets: [
      {
        ticketId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "CreateMovieTicket" 
        },
        MovieName: String,
        showDate: Date,
        showTime: String,
        ticketCategory: String,

        // ✅ already selected seats
        selectedSeats: [String],

        pricePerTicket: Number,

          language: String,
        theatrePlace: String,

        // ✅ ADD THIS (per ticket subtotal)
        subTotal: { 
          type: Number, 
          default: 0 
        },

        ticketImage: String,
        quantity: { 
          type: Number, 
          default: 1 
        },
      }
    ],

    cartTotal: { 
      type: Number, 
      default: 0 
    },

    totalAmount: { 
      type: Number, 
      default: 0 
    }
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
