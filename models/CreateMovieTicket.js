import mongoose from "mongoose";

const createMovieTicketSchema = new mongoose.Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Moviename",  },
    fullName: { type: String, },
    phoneNumber: { type: String,},
    email: { type: String,},
    MovieName: { type: String, },
    language: { type: String, },
    theatrePlace: { type: String,  },
    showDate: { type: Date,  },
    showTime: { type: String,  },
    ticketCategory: { type: String,  }, 
    noOfTickets: { type: Number,  },
    selectedSeats: [{ type: String,  }], 
    pricePerTicket: { type: Number,  },
    totalPrice: { type: Number,  },
    ticketImage: { type: String }, // URL of ticket image
    qrCodeLink: { type: String }, // URL or link to QR code
     purchasedSeats: {
  type: [String],
  default: []
},
     ticketType: {
      type: String,
    },

    screen: {
      type: String,
    },

    qrCode: {
      type: String,
    },
    termsAndConditionsAccepted: { type: Boolean, default: false },
      status: {
        type: String,
        default: "pending"
    },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
      // ✅ New fields for tracking
    soldCount: { type: Number, default: 0 },       // Tickets already sold
    remainingCount: { type: Number, default: 0 }   // Tickets remaining
}, { timestamps: true });

export default mongoose.model("CreateMovieTicket", createMovieTicketSchema);
