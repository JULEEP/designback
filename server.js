import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import http from 'http';
import authRoutes from "./routes/AuthRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CreateMovieTicket from './models/CreateMovieTicket.js';
import User from "./models/AuthModel.js"
import cron from 'node-cron'; // ✅ add cron
dotenv.config();

const app = express();
const server = http.createServer(app);



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------
// REQUIRED MIDDLEWARE
// ----------------------
app.use(cors());
app.use(express.json());                           // ✅ VERY IMPORTANT
app.use(express.urlencoded({ extended: true }));   // ✅ VERY IMPORTANT
app.use(cookieParser());

// ----------------------
// ROUTES
// ----------------------
app.use("/api/auth", authRoutes);   // MUST COME AFTER JSON MIDDLEWARE
app.use("/api/admin", adminRoutes);   // MUST COME AFTER JSON MIDDLEWARE


// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------------
// MONGODB CONNECTION
// ----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✔"))
  .catch(err => console.log("DB Error:", err));

// ----------------------
// TEST ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send({ message: "Server Running..." });
});

const autoAddAmountToWallet = async () => {
  try {
    const now = new Date();

    // 1️⃣ Fetch all tickets which are NOT reported
    const tickets = await CreateMovieTicket.find({ isReported: false, status: { $ne: "pending" } });

    if (!tickets || tickets.length === 0) {
      console.log("No tickets eligible for wallet update.");
      return;
    }

    for (const ticket of tickets) {
      const user = await User.findById(ticket.userId);
      if (!user) continue;

      // Combine showDate + showTime
      const showDateTime = new Date(ticket.showDate);
      const [hours, minutes] = ticket.showTime.split(":").map(Number);
      showDateTime.setHours(hours);
      showDateTime.setMinutes(minutes);

      // 2️⃣ Only if show has passed
      if (now > showDateTime) {
        const bookedQty = ticket.selectedSeats?.length || ticket.quantity || 1;
        const amountToAdd = ticket.pricePerTicket * bookedQty;

        // 3️⃣ Update user's wallet
        user.wallet = user.wallet || { balance: 0, history: [] };
        user.wallet.balance += amountToAdd;
        user.wallet.history.push({
          orderId: ticket._id,
          amount: amountToAdd,
          ticketDetails: ticket.toObject(),
          addedAt: now
        });

        await user.save();

        console.log(`Added ₹${amountToAdd} to ${user.fullName}'s wallet for ticket ${ticket._id}`);
      }
    }

  } catch (error) {
    console.error("❌ Auto wallet update error:", error);
  }
};

// ----------------------
// CRON JOB - RUN EVERY 5 MINUTES
// ----------------------
cron.schedule("*/5 * * * *", async () => {
  console.log("Running automatic wallet update...");
  await autoAddAmountToWallet();
});


// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 8127;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
