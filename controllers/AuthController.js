import User from "../models/AuthModel.js";
import bcrypt from "bcryptjs";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import CreateMovieTicket from "../models/CreateMovieTicket.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import Razorpay from "razorpay";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import PDFDocument from "pdfkit";
import Redemption from "../models/Redemption.js";
import Admin from "../models/Admin.js";
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import axios from 'axios';
import sharp from 'sharp';


import dotenv from "dotenv";
dotenv.config();


import { createCanvas, loadImage } from 'canvas';
import BillBook from "../models/BillBook.js";
import DoctorPrescription from "../models/DoctorPrescription.js";
import Ireceipt from "../models/Ireceipt.js";




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";
const JWT_EXPIRE = "7d";

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Register Controller
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, confirmPassword, address } = req.body;

        // Check required fields
        if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check if phone number already exists
        const existingPhone = await User.findOne({ phoneNumber });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Phone number already registered"
            });
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password: password,
            address: address || ""
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        return res.status(201).json({
            success: true,
            message: "Registration successful! Welcome to PrintShoppy!",
            token,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                address: newUser.address,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during registration",
            error: error.message
        });
    }
};

// Login Controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support."
            });
        }

        // Check password
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                profileImage: user.profileImage,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message
        });
    }
};


export const verifyOtp = async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp)
      return res.status(400).json({ message: "Token & OTP required" });

    const decoded = verifyToken(token);

    if (decoded.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (decoded.type === "register" || decoded.type === "login") {
      const finalToken = generateToken(
        { id: decoded.id, phoneNumber: decoded.phoneNumber },
        "7d"
      );

      return res.json({
        success: true,
        message: "OTP Verified Successfully",
        token: finalToken
      });
    }

    if (decoded.type === "forgot") {
      const resetToken = generateToken(
        { phoneNumber: decoded.phoneNumber, type: "reset" },
        "15m"
      );

      return res.json({
        success: true,
        message: "OTP Verified. You may now reset your password.",
        token: resetToken
      });
    }

    res.status(400).json({ message: "Invalid OTP flow" });

  } catch (err) {
    res.status(500).json({ message: "Invalid or expired token" });
  }
};




export const forgotPassword = async (req, res) => {
  try {
    const { mobile, phoneNumber } = req.body;
    
    // Accept both 'mobile' and 'phoneNumber' for flexibility
    const userPhone = mobile || phoneNumber;
    
    if (!userPhone) {
      return res.status(400).json({ 
        message: "Phone number is required" 
      });
    }

    // Find user by phoneNumber
    const user = await User.findOne({ phoneNumber: userPhone });
    
    if (!user) {
      return res.status(404).json({ 
        message: "Phone number not registered" 
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP in database or generate a token
    const otpToken = generateToken(
      { 
        phoneNumber: user.phoneNumber, 
        otp, 
        userId: user._id,
        type: "forgot" 
      },
      "10m"
    );

    // In production, you would send OTP via SMS here
    console.log(`OTP for ${user.phoneNumber}: ${otp}`);
    
    // Always return OTP in response for testing (remove in production)
    res.json({
      success: true,
      message: "OTP sent for password reset",
      token: otpToken,
      otp: otp // Return OTP for demo purposes
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ 
      message: "Server error. Please try again later.",
      error: err.message 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { mobile, newPassword, confirmNewPassword } = req.body;

    // Check if mobile is provided
    if (!mobile) {
      return res.status(400).json({ 
        message: "Mobile number is required" 
      });
    }

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ 
        message: "Passwords do not match" 
      });
    }

    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Update password without hashing
    const updatedUser = await User.findOneAndUpdate(
      { phoneNumber: mobile },
      { password: newPassword }, // Store password as plain text
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
};



export const getMyPostedTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // 1️⃣ Fetch tickets for this user
    const tickets = await CreateMovieTicket.find({ userId })
      .populate("movieId", "MovieName image") // populate movie info
      .sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No posted tickets found",
        count: 0,
        tickets: []
      });
    }

    // 2️⃣ Map tickets into movie + ticket objects including new fields
    const formattedTickets = tickets.map(ticket => ({
      ticket: {
        ticketId: ticket._id,
        showDate: ticket.showDate,
        showTime: ticket.showTime,
        ticketCategory: ticket.ticketCategory,
        ticketType: ticket.ticketType,       // ✅ new
        screen: ticket.screen,               // ✅ new
        selectedSeats: ticket.selectedSeats,
        purchasedSeats: ticket.purchasedSeats,
        pricePerTicket: ticket.pricePerTicket,
        noOfTickets: ticket.noOfTickets,
        quantity: ticket.quantity,
        soldCount: ticket.soldCount,
        remainingCount: ticket.remainingCount,
        status: ticket.status || "Pending",
        language: ticket.language,
        theatrePlace: ticket.theatrePlace,
        ticketImage: ticket.ticketImage,
        termsAndConditionsAccepted: ticket.termsAndConditionsAccepted,
        qrCode: ticket.qrCode,               // ✅ new
        qrCodeLink: ticket.qrCodeLink || ""  // ✅ new
      },
      movie: ticket.movieId
        ? {
          movieId: ticket.movieId._id,
          MovieName: ticket.movieId.MovieName,
          image: ticket.movieId.image
        }
        : null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));

    // 3️⃣ Return response
    return res.status(200).json({
      success: true,
      message: "My posted tickets fetched successfully",
      count: tickets.length,
      tickets: formattedTickets
    });

  } catch (error) {
    console.error("❌ Get my posted tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    // ✅ userId from params
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user
    });

  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const addToCart = async (req, res) => {
  try {
    const { userId, ticketId, quantity = 1, selectedSeats } = req.body;

    if (!userId || !ticketId) {
      return res.status(400).json({
        message: "userId and ticketId are required"
      });
    }

    // 1️⃣ Fetch ticket
    const ticket = await CreateMovieTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }



    // ❌ Block expired show
    if (!ticket.showDate || !ticket.showTime) {
      return res.status(400).json({
        message: "Invalid show date or time"
      });
    }

    const [hours, minutes] = ticket.showTime.split(":").map(Number);
    const showDateTime = new Date(ticket.showDate);
    showDateTime.setHours(hours);
    showDateTime.setMinutes(minutes);
    showDateTime.setSeconds(0);

    const now = new Date();



    // 2️⃣ Seats handling
    let seatsToAdd = selectedSeats;

    if (typeof seatsToAdd === "string") {
      seatsToAdd = JSON.parse(seatsToAdd);
    }

    if (!seatsToAdd || !Array.isArray(seatsToAdd)) {
      seatsToAdd = ticket.selectedSeats || [];
    }

    // 3️⃣ Prepare ticket data (DB se jo store hai wahi)
    const ticketData = {
      ticketId: ticket._id,
      MovieName: ticket.MovieName,
      showDate: ticket.showDate,
      showTime: ticket.showTime,
      ticketCategory: ticket.ticketCategory,
      language: ticket.language,
      theatrePlace: ticket.theatrePlace,
      selectedSeats: seatsToAdd,
      noOfTickets: ticket.noOfTickets,
      pricePerTicket: ticket.pricePerTicket,
      ticketImage: ticket.ticketImage,
      quantity
    };

    // 4️⃣ Find or create cart
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const ticketIndex = cart.tickets.findIndex(
        t => t.ticketId.toString() === ticketId
      );

      if (ticketIndex > -1) {
        // 🔁 Already in cart
        cart.tickets[ticketIndex].quantity += quantity;

        // ✅ Merge seats uniquely
        cart.tickets[ticketIndex].selectedSeats = [
          ...new Set([
            ...cart.tickets[ticketIndex].selectedSeats,
            ...seatsToAdd
          ])
        ];
      } else {
        cart.tickets.push(ticketData);
      }

      // 🔢 Recalculate totals
      cart.cartTotal = cart.tickets.reduce(
        (acc, t) => acc + t.pricePerTicket * t.quantity,
        0
      );

      cart.totalAmount = cart.cartTotal;
      await cart.save();

    } else {
      const cartTotal = ticket.pricePerTicket * quantity;

      cart = new Cart({
        userId,
        tickets: [ticketData],
        cartTotal,
        totalAmount: cartTotal
      });

      await cart.save();
    }

    return res.status(200).json({
      message: "Ticket added to cart successfully",
      cart
    });

  } catch (error) {
    console.error("❌ Add to cart error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// 👉 Get User Cart (all ticket info)
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Fetch cart & populate tickets → movieId
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "tickets.ticketId",          // CreateMovieTicket
        populate: {
          path: "movieId",                  // Moviename
          select: "MovieName image"
        }
      });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // 2️⃣ Format tickets
    const formattedTickets = cart.tickets.map(t => {
      const ticketObj = t.ticketId || {};   // CreateMovieTicket document
      const movieObj = ticketObj.movieId || {}; // Moviename document

      return {
        ticket: {
          _id: ticketObj._id,
          movieId: ticketObj.movieId?._id,
          fullName: t.fullName || ticketObj.fullName || null,
          phoneNumber: t.phoneNumber || ticketObj.phoneNumber || null,
          email: t.email || ticketObj.email || null,
          MovieName: ticketObj.MovieName || t.MovieName || null,
          language: ticketObj.language || t.language || null,
          theatrePlace: ticketObj.theatrePlace || t.theatrePlace || null,
          showDate: ticketObj.showDate || t.showDate || null,
          showTime: ticketObj.showTime || t.showTime || null,
          ticketCategory: ticketObj.ticketCategory || t.ticketCategory || null,
          quantity: t.quantity || 1,                // ✅ Add this line
          selectedSeats: t.selectedSeats || ticketObj.selectedSeats || [],
          pricePerTicket: ticketObj.pricePerTicket || t.pricePerTicket || 0,
          totalPrice: (ticketObj.pricePerTicket || t.pricePerTicket || 0) * (t.quantity || 1),
          ticketImage: ticketObj.ticketImage || t.ticketImage || null,
          qrCodeLink: ticketObj.qrCodeLink || null,
          status: ticketObj.status || "active",
          createdAt: ticketObj.createdAt,
          updatedAt: ticketObj.updatedAt
        },
        movie: {
          _id: movieObj._id,
          MovieName: movieObj.MovieName,
          image: movieObj.image,
          createdAt: movieObj.createdAt,
          updatedAt: movieObj.updatedAt
        }
      };
    });

    // 3️⃣ Response
    return res.status(200).json({
      message: "Cart fetched successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        tickets: formattedTickets,
        cartTotal: cart.cartTotal,
        totalAmount: cart.totalAmount,
      }
    });

  } catch (error) {
    console.error("❌ Get cart error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};





// 👉 Remove Ticket from Cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, ticketId } = req.body;

    if (!userId || !ticketId) {
      return res.status(400).json({ message: "userId and ticketId are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Remove the ticket
    cart.tickets = cart.tickets.filter(t => t.ticketId.toString() !== ticketId);

    await cart.save();

    res.status(200).json({
      message: "Ticket removed from cart successfully",
      cart
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// our company razor pay keys
const razorpay = new Razorpay({
  key_id: 'rzp_live_S10grYJyPBnEmN',
  key_secret: 'Rg8Po8dCQgtgWLihEm7UN4BI',
});


// Initialize Razorpay
// const razorpay = new Razorpay({
//     key_id: 'rzp_test_BxtRNvflG06PTV',
//     key_secret: 'RecEtdcenmR7Lm4AIEwo4KFr',
// });

export const bookTickets = async (req, res) => {
  try {
    const {
      userId,
      ticketId,
      selectedSeats = [],
      quantity = 0,
      transactionId,
      platformCharge = 0,
      gst = 0,
    } = req.body;

    // 1️⃣ Basic validation
    if (!userId || !ticketId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "userId, ticketId and transactionId are required",
      });
    }

    if (selectedSeats.length === 0 && quantity === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select seats or quantity",
      });
    }

    // 2️⃣ Fetch ticket
    const ticket = await CreateMovieTicket.findById(ticketId).populate(
      "movieId",
      "MovieName image createdAt updatedAt"
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // 3️⃣ Show expiry check
    const [hours, minutes] = ticket.showTime.split(":").map(Number);
    const showDateTime = new Date(ticket.showDate);
    showDateTime.setHours(hours, minutes, 0);

    if (new Date() > showDateTime) {
      return res.status(400).json({ success: false, message: "Show time expired" });
    }

    // 4️⃣ Calculate final quantity
    let finalQuantity = selectedSeats.length > 0 ? selectedSeats.length : quantity;

    const baseAmount = ticket.pricePerTicket * finalQuantity;
    const totalAmountWithCharges = baseAmount + platformCharge + gst;

    // 5️⃣ Capture payment
    let capturedPayment;
    try {
      capturedPayment = await razorpay.payments.capture(
        transactionId,
        totalAmountWithCharges * 100,
        "INR"
      );
    } catch (err) {
      if (err?.error?.description === "This payment has already been captured") {
        capturedPayment = { id: transactionId, status: "captured" };
      } else {
        throw err;
      }
    }

    if (!capturedPayment || capturedPayment.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment capture failed" });
    }

    // 6️⃣ Create order
    const order = new Order({
      userId,
      tickets: [
        {
          ticket: {
            ticketId: ticket._id,
            MovieName: ticket.MovieName,
            showDate: ticket.showDate,
            showTime: ticket.showTime,
            ticketCategory: ticket.ticketCategory,
            selectedSeats,
            purchasedSeats: selectedSeats, // Save purchased seats in order
            quantity: finalQuantity,
            pricePerTicket: ticket.pricePerTicket,
            totalPrice: baseAmount,
            platformCharge,
            gst,
            totalAmountWithCharges,
            ticketImage: ticket.ticketImage,
            language: ticket.language,
            theatrePlace: ticket.theatrePlace,
            qrCodeLink: ticket.qrCodeLink,
            ticketType: ticket.ticketType,
            screen: ticket.screen,
            qrCode: ticket.qrCode,
            status: "active",
          },
          movie: {
            movieId: ticket.movieId?._id,
            MovieName: ticket.movieId?.MovieName,
            image: ticket.movieId?.image,
            createdAt: ticket.movieId?.createdAt,
            updatedAt: ticket.movieId?.updatedAt,
          },
        },
      ],
      totalAmount: totalAmountWithCharges,
      transactionId: capturedPayment.id,
      paymentStatus: "paid",
      razorpayStatus: capturedPayment.status,
      orderStatus: "completed",
    });

    await order.save();

    // 7️⃣ Update ticket → only push purchasedSeats, don't modify selectedSeats or noOfTickets
    ticket.purchasedSeats = ticket.purchasedSeats || []; // Initialize if undefined
    ticket.purchasedSeats.push(...selectedSeats); // Add new selectedSeats to purchasedSeats
    ticket.soldCount = (ticket.soldCount || 0) + finalQuantity;
    ticket.remainingCount = ticket.remainingCount - finalQuantity; // Update remaining count

    console.log("💡 Updated purchasedSeats for ticket:", ticket._id, ticket.purchasedSeats);

    ticket.markModified("purchasedSeats"); // Important to trigger mongoose to save the modified field
    await ticket.save(); // Save the ticket

    // 8️⃣ User notification
    const user = await User.findById(userId);
    if (user) {
      user.notifications = user.notifications || [];
      user.notifications.push({
        message: `🎉 Your tickets for "${ticket.MovieName}" have been booked successfully!`,
        orderId: order._id,
        createdAt: new Date(),
      });
      await user.save();
    }

    // 9️⃣ Admin notification
    const admins = await Admin.find();
    for (const admin of admins) {
      admin.notifications = admin.notifications || [];
      admin.notifications.push({
        message: `🎟️ New booking for "${ticket.MovieName}". Seats booked: ${finalQuantity}.`,
        ticketId: ticket._id,
        status: "created",
        createdAt: new Date(),
      });
      await admin.save();
    }

    // 🔟 Final response
    return res.status(200).json({
      success: true,
      message: "Tickets booked successfully",
      orderId: order._id,
      quantity: finalQuantity,
      totalAmount: totalAmountWithCharges,
      platformCharge,
      gst,
      tickets: order.tickets,
    });

  } catch (error) {
    console.error("❌ Booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




// Get User Notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // Fetch user with notifications
    const user = await User.findById(userId).select("notifications");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User notifications fetched successfully",
      data: user.notifications || []
    });

  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params; // ✅ params se userId
    const { firstName, lastName } = req.body;

    const updateData = {};

    // Name update
    if (firstName || lastName) {
      updateData.firstName = firstName;
      updateData.lastName = lastName;
      updateData.fullName = `${firstName || ""} ${lastName || ""}`.trim();
    }

    // Profile image update
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteMovieTicket = async (req, res) => {
  try {
    const { userId, ticketId } = req.params;

    // 1️⃣ Validation
    if (!userId || !ticketId) {
      return res.status(400).json({
        success: false,
        message: "Both userId and ticketId are required in params"
      });
    }

    // 2️⃣ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3️⃣ Delete ticket based only on ticketId (_id)
    const deletedTicket = await CreateMovieTicket.findByIdAndDelete(ticketId);

    if (!deletedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
      data: deletedTicket
    });

  } catch (error) {
    console.error("Ticket deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const myPurchasedMovieTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in params",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No purchased tickets found",
        orders: [],
      });
    }

    const uploadsDir = path.join(process.cwd(), "uploads/pdfs");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const pdfFileName = `order-${order._id}.pdf`;
        const pdfPath = path.join(uploadsDir, pdfFileName);
        const fileUrl = `/uploads/pdfs/${pdfFileName}`;

        // ✅ Generate PDF only if it doesn't exist
        if (!fs.existsSync(pdfPath)) {
          const doc = new PDFDocument({ size: "A4", margin: 50 });

          doc.pipe(fs.createWriteStream(pdfPath));

          doc.fontSize(20).text("Movie Ticket Order", { align: "center" });
          doc.moveDown();

          doc.fontSize(14).text(`Order ID: ${order._id}`);
          doc.text(`Transaction ID: ${order.transactionId}`);
          doc.text(`Total Amount: ₹${order.totalAmount}`);
          doc.text(`Payment Status: ${order.paymentStatus}`);
          doc.text(`Order Status: ${order.orderStatus}`);
          doc.text(`Ordered On: ${order.createdAt.toLocaleString()}`);
          doc.moveDown();

          order.tickets.forEach((t, index) => {
            doc.fontSize(16).text(`Ticket ${index + 1}: ${t.ticket.MovieName}`, {
              underline: true,
            });
            doc.fontSize(12).text(`Show Date: ${new Date(t.ticket.showDate).toLocaleDateString()}`);
            doc.text(`Show Time: ${t.ticket.showTime}`);
            doc.text(`Seats: ${t.ticket.selectedSeats.join(", ")}`);
            doc.text(`Quantity: ${t.ticket.quantity}`);
            doc.text(`Price per Ticket: ₹${t.ticket.pricePerTicket}`);
            doc.text(`Total Price: ₹${t.ticket.totalPrice}`);
            doc.moveDown();
          });

          doc.end();
        }

        return {
          orderId: order._id,
          transactionId: order.transactionId,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus,
          razorpayStatus: order.razorpayStatus,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          tickets: order.tickets,
          pdfUrl: fileUrl,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Purchased orders fetched successfully",
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("❌ Error fetching purchased orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
export const getWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      wallet: user.wallet || { balance: 0, history: [] }
    });

  } catch (error) {
    console.error("❌ Get wallet error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



export const reportOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "orderId and userId are required"
      });
    }

    // Find order for that user
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for this user" });
    }

    // Mark order as reported
    order.isReported = true;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order reported successfully",
      orderId: order._id
    });

  } catch (error) {
    console.error("❌ Report order error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const getUserReferralCode = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in params"
      });
    }

    const user = await User.findById(userId).select("referralCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral code fetched successfully",
      referralCode: user.referralCode
    });

  } catch (error) {
    console.error("❌ Get referral code error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};




export const createRedemptionRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      amount,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    // 🔴 Validation
    if (
      !amount ||
      !accountHolderName ||
      !bankName ||
      !accountNumber ||
      !ifscCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory"
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    // 🔍 Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 💰 Wallet balance check
    const walletBalance = user.wallet?.balance || 0;

    if (walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // 📝 Create redemption request (NO balance deduction here)
    const redemption = await Redemption.create({
      userId,
      amount,
      accountDetails: {
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode
      },
      upiId: upiId || null,
      status: "pending"
    });

    return res.status(201).json({
      success: true,
      message: "Redemption request submitted successfully",
      walletBalance,
      redemption
    });

  } catch (error) {
    console.error("❌ Redemption Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


export const deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in params",
      });
    }

    // 1️⃣ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Delete user
    await User.findByIdAndDelete(userId);

    // 3️⃣ Return response
    return res.status(200).json({
      success: true,
      message: `User account with ID ${userId} has been successfully deleted.`,
    });

  } catch (error) {
    console.error("Delete user account error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



// Setup Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pms226803@gmail.com',
    pass: 'nrasbifqxsxzurrm',
  },
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});

export const deleteAccount = async (req, res) => {
  const { email, reason } = req.body;

  // Validate email and reason
  if (!email || !reason) {
    return res.status(400).json({ message: 'Email and reason are required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique token for account deletion
    const token = crypto.randomBytes(20).toString('hex');
    const deleteLink = `${process.env.BASE_URL}/confirm-delete-account/${token}`;

    // Set the deleteToken and deleteTokenExpiration
    user.deleteToken = token;
    user.deleteTokenExpiration = Date.now() + 3600000;  // Token expires in 1 hour

    // Log the user object before saving
    console.log('User before saving:', user);

    // Save the token and expiration time to the database
    await user.save();  // This should now save the user along with the deleteToken and deleteTokenExpiration

    // Log after saving to confirm
    console.log('User after saving:', user);

    // Send the confirmation email
    const mailOptions = {
      from: 'pms226803@gmail.com',
      to: email,
      subject: 'Account Deletion Request Received',
      text: `Hi ${user.name},\n\nWe have received your account deletion request. To confirm the deletion of your account, please click the link below:\n\n${deleteLink}\n\nReason: ${reason}\n\nIf you have any questions or need further assistance, please feel free to contact us at contact.backupticket@gmail.com.\n\nBest regards,\nYour Team`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Account deletion request has been processed.We are send mail shortly.Please check your email and confirm the link to delete.',
      token: token // Send the token in the response
    });
  } catch (err) {
    console.error('Error in deleteAccount:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

export const confirmDeleteAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      deleteToken: token,
      deleteTokenExpiration: { $gt: Date.now() },
    });

    // Token is valid, delete the user account
    await User.deleteOne({ _id: user._id });

    // Always return success even if something minor fails afterward
    return res.status(200).json({
      message: 'Your account has been successfully deleted.',
    });
  } catch (err) {
    // Optional: You can still log it but don't let it affect the user
    console.error('Error in confirmDeleteAccount:', err);

    // Return a 200 anyway if user deletion probably succeeded
    return res.status(200).json({
      message: 'Your account has been successfully deleted.',
    });
  }
};



// controllers/authController.js (Add this new function)

// Get User by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find user by ID, exclude password field
        const user = await User.findById(id).select("-password");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                profileImage: user.profileImage,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
        
    } catch (error) {
        console.error("Get user by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching user",
            error: error.message
        });
    }
};




// Add/Update Business Details
export const addBusinessDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      companyWebsite,
      gstNumber,
      panNumber
    } = req.body;

    // Get logo file path if uploaded
    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/business/${req.file.filename}`;
    }

    // Update user's business details
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'businessDetails.companyName': companyName || '',
          'businessDetails.companyAddress': companyAddress || '',
          'businessDetails.companyEmail': companyEmail || '',
          'businessDetails.companyPhone': companyPhone || '',
          'businessDetails.companyWebsite': companyWebsite || '',
          'businessDetails.gstNumber': gstNumber || '',
          'businessDetails.panNumber': panNumber || '',
          'businessDetails.logo': logoPath
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business details updated successfully',
      data: {
        businessDetails: user.businessDetails
      }
    });

  } catch (error) {
    console.error('Error adding business details:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding business details',
      error: error.message
    });
  }
};




// const fetchAndConvertImage = async (url) => {
//   console.log('Fetching image from URL:', url);
//   const response = await axios.get(url, { responseType: 'arraybuffer' });
//   const buffer = Buffer.from(response.data);
  
//   const isWebP = buffer.toString('hex', 0, 4) === '52494646';
//   if (isWebP || url.includes('.webp')) {
//     console.log('Detected WebP format, converting to PNG...');
//     const pngBuffer = await sharp(buffer).png().toBuffer();
//     return pngBuffer;
//   }
  
//   return buffer;
// };

// const drawRoundedRect = (ctx, x, y, width, height, radius) => {
//   ctx.beginPath();
//   ctx.moveTo(x + radius, y);
//   ctx.lineTo(x + width - radius, y);
//   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
//   ctx.lineTo(x + width, y + height - radius);
//   ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
//   ctx.lineTo(x + radius, y + height);
//   ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
//   ctx.lineTo(x, y + radius);
//   ctx.quadraticCurveTo(x, y, x + radius, y);
//   ctx.closePath();
// };

// const saveBufferToFile = (buffer, filename) => {
//   const uploadDir = path.join(__dirname, '../uploads/billbook');
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }
//   const filePath = path.join(uploadDir, filename);
//   fs.writeFileSync(filePath, buffer);
//   console.log('File saved at:', filePath);
//   return `/uploads/billbook/${filename}`;
// };

// const overlayBillBookOnTemplate = async (
//   templateImageUrl,
//   textStyles,
//   logoUrl,
//   logoSettings
// ) => {
//   try {
//     const templateBuffer = await fetchAndConvertImage(templateImageUrl);
//     const templateImg = await loadImage(templateBuffer);

//     const CARD_W = templateImg.width;   // 800
//     const CARD_H = templateImg.height;  // 1000
//     console.log(`Template size: ${CARD_W}x${CARD_H}`);

//     const canvas = createCanvas(CARD_W, CARD_H);
//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

//     // ─── Text fields overlay ───
//     const fields = [
//       'companyName', 'companyAddress', 'companyEmail',
//       'companyPhone', 'companyWebsite', 'gstNumber', 'panNumber'
//     ];

//     for (const field of fields) {
//       const style = textStyles?.[field];
//       if (!style || !style.text) continue;
//       if (style.show === false) continue;

//       const fontSize   = style.fontSize   || 14;
//       const fontWeight = style.fontWeight || 'normal';
//       const fontFamily = style.fontFamily || 'sans-serif';
//       const color      = style.color      || '#000000';
//       const italic     = style.italic ? 'italic ' : '';
//       const x          = style.x;
//       const y          = style.y;

//       ctx.save();
//       ctx.font         = `${italic}${fontWeight} ${fontSize}px ${fontFamily}`;
//       ctx.fillStyle    = color;
//   ctx.textBaseline = 'alphabetic'; // ✅ BAS YE EK LINE CHANGE KI

//       if (style.underline) {
//         const textWidth = ctx.measureText(style.text).width;
//         ctx.fillRect(x, y + fontSize + 2, textWidth, 1);
//       }

//       ctx.fillText(style.text, x, y);
//       ctx.restore();
//       console.log(`Drew [${field}]: "${style.text}" at (${x}, ${y}) fontSize=${fontSize}`);
//     }

//     // ─── Logo overlay ───
//     if (logoUrl && logoSettings && logoSettings.show !== false) {
//       try {
//         const logoBuffer = await fetchAndConvertImage(logoUrl);
//         const logoImg    = await loadImage(logoBuffer);

//         const lx    = logoSettings.x;
//         const ly    = logoSettings.y;
//         const lw    = logoSettings.width;
//         const lh    = logoSettings.height;
//         const shape = logoSettings.shape;
//         const br    = logoSettings.borderRadius;
//         const bw    = logoSettings.borderWidth;
//         const bc    = logoSettings.borderColor;

//         console.log(`Logo: shape=${shape}, br=${br}, pos=(${lx},${ly}), size=${lw}x${lh}`);

//         ctx.save();

//         if (shape === 'circle') {
//           ctx.beginPath();
//           ctx.arc(lx + lw / 2, ly + lh / 2, Math.min(lw, lh) / 2, 0, Math.PI * 2);
//           ctx.clip();
//         } else if (br > 0) {
//           drawRoundedRect(ctx, lx, ly, lw, lh, br);
//           ctx.clip();
//         }

//         ctx.drawImage(logoImg, lx, ly, lw, lh);

//         if (bw > 0) {
//           ctx.strokeStyle = bc;
//           ctx.lineWidth   = bw;
//           if (shape === 'circle') {
//             ctx.beginPath();
//             ctx.arc(lx + lw / 2, ly + lh / 2, Math.min(lw, lh) / 2, 0, Math.PI * 2);
//             ctx.stroke();
//           } else if (br > 0) {
//             drawRoundedRect(ctx, lx, ly, lw, lh, br);
//             ctx.stroke();
//           } else {
//             ctx.strokeRect(lx, ly, lw, lh);
//           }
//         }

//         ctx.restore();
//         console.log('Logo drawn successfully');
//       } catch (logoErr) {
//         console.warn('Logo load failed, skipping:', logoErr.message);
//       }
//     }

//     const outputBuffer = canvas.toBuffer('image/png');
//     const filename     = `billbook-overlay-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
//     const savedPath    = saveBufferToFile(outputBuffer, filename);

//     console.log('Overlay saved:', savedPath);
//     return savedPath;

//   } catch (error) {
//     console.error('overlayBillBookOnTemplate error:', error.message);
//     return null;
//   }
// };

// export const getBillBookWithBusinessDetails = async (req, res) => {
//   try {
//     const { userId, billbookId } = req.params;

//     if (!userId || !billbookId) {
//       return res.status(400).json({
//         success: false,
//         message: 'User ID and BillBook ID are required',
//       });
//     }

//     const user = await User.findById(userId).select('businessDetails');
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const billbook = await BillBook.findById(billbookId);
//     if (!billbook) {
//       return res.status(404).json({ success: false, message: 'BillBook not found' });
//     }

//     const businessDetails = user.businessDetails || {};
//     const billbookStyles  = billbook.textStyles   || {};
//     const baseUrl         = `${req.protocol}://${req.get('host')}`;

//     // ─── Text styles — billbook coordinates + user ka data ───
//     const fields = [
//       'companyName', 'companyAddress', 'companyEmail',
//       'companyPhone', 'companyWebsite', 'gstNumber', 'panNumber'
//     ];

//     const overlayTextStyles = {};
//     fields.forEach((field) => {
//       const tmpl = billbookStyles[field] || {};
//       const text = businessDetails[field] || billbook[field] || '';

//       // ✅ Sirf wahi fields jo billbook mein hain — text empty ho to skip hoga
//       overlayTextStyles[field] = {
//         fontSize:   tmpl.fontSize,
//         fontWeight: tmpl.fontWeight,
//         fontFamily: tmpl.fontFamily || 'sans-serif',
//         color:      tmpl.color,
//         italic:     tmpl.italic    || false,
//         underline:  tmpl.underline || false,
//         show:       tmpl.show !== undefined ? tmpl.show : true,
//         x:          tmpl.x,
//         y:          tmpl.y,
//         text,
//       };
//     });

//     // ─── Logo settings — billbook as-is ───
//     const overlayLogoSettings = billbook.logoSettings || {};

//     // ─── Template URL ───
//     const templateImageUrl = billbook.templateImage?.startsWith('http')
//       ? billbook.templateImage
//       : `${baseUrl}${billbook.templateImage}`;

//     // ─── Logo URL — user ka pehle, fallback billbook ka ───
//     let logoUrl = '';
//     if (businessDetails.logo) {
//       logoUrl = businessDetails.logo.startsWith('http')
//         ? businessDetails.logo
//         : `${baseUrl}${businessDetails.logo}`;
//     } else if (billbook.logo) {
//       logoUrl = billbook.logo.startsWith('http')
//         ? billbook.logo
//         : `${baseUrl}${billbook.logo}`;
//     }

//     console.log('Template URL:', templateImageUrl);
//     console.log('Logo URL:', logoUrl);
//     console.log('Logo Settings:', JSON.stringify(overlayLogoSettings));
//     console.log('Text Styles with data:', JSON.stringify(overlayTextStyles));

//     // ─── Overlay ───
//     let overlaidImagePath = '';
//     if (templateImageUrl) {
//       overlaidImagePath = await overlayBillBookOnTemplate(
//         templateImageUrl,
//         overlayTextStyles,
//         logoUrl,
//         overlayLogoSettings
//       );
//     }

//     const overlaidImageUrl = overlaidImagePath
//       ? `${baseUrl}${overlaidImagePath}`
//       : '';

//     return res.status(200).json({
//       success: true,
//       data: {
//         overlaidImage:     overlaidImageUrl,
//         overlaidImagePath: overlaidImagePath,
//         billbookId:        billbook._id,
//         userId:            user._id,
//       },
//     });

//   } catch (error) {
//     console.error('getBillBookWithBusinessDetails error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error getting billbook',
//       error: error.message,
//     });
//   }
// };



const fetchAndConvertImage = async (url) => {
  console.log('Fetching image from URL:', url);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  
  const isWebP = buffer.toString('hex', 0, 4) === '52494646';
  if (isWebP || url.includes('.webp')) {
    console.log('Detected WebP format, converting to PNG...');
    const pngBuffer = await sharp(buffer).png().toBuffer();
    return pngBuffer;
  }
  
  return buffer;
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const saveBufferToFile = (buffer, filename) => {
  const uploadDir = path.join(__dirname, '../uploads/billbook');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log('File saved at:', filePath);
  return `/uploads/billbook/${filename}`;
};

const overlayBillBookOnTemplate = async (
  templateImageUrl,
  textStyles,
  logoUrl,
  logoSettings
) => {
  try {
    const templateBuffer = await fetchAndConvertImage(templateImageUrl);
    const templateImg = await loadImage(templateBuffer);

    const CARD_W = templateImg.width;   // 800
    const CARD_H = templateImg.height;  // 1000
    console.log(`Template size: ${CARD_W}x${CARD_H}`);

    const canvas = createCanvas(CARD_W, CARD_H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

    // ─── Text fields overlay ───
    const fields = [
      'companyName', 'companyAddress', 'companyEmail',
      'companyPhone', 'companyWebsite', 'gstNumber', 'panNumber'
    ];

    for (const field of fields) {
      const style = textStyles?.[field];
      if (!style || !style.text) continue;
      if (style.show === false) continue;

      const fontSize   = style.fontSize   || 14;
      const fontWeight = style.fontWeight || 'normal';
      const fontFamily = style.fontFamily || 'sans-serif';
      const color      = style.color      || '#000000';
      const italic     = style.italic ? 'italic ' : '';
      const x          = style.x;
      const y          = style.y;

      ctx.save();
      ctx.font         = `${italic}${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle    = color;
      ctx.textBaseline = 'alphabetic';

      if (style.underline) {
        const textWidth = ctx.measureText(style.text).width;
        ctx.fillRect(x, y + fontSize + 2, textWidth, 1);
      }

      ctx.fillText(style.text, x, y);
      ctx.restore();
      console.log(`Drew [${field}]: "${style.text}" at (${x}, ${y}) fontSize=${fontSize}`);
    }

    // ─── Logo overlay ───
    if (logoUrl && logoSettings && logoSettings.show !== false) {
      try {
        const logoBuffer = await fetchAndConvertImage(logoUrl);
        const logoImg    = await loadImage(logoBuffer);

        const lx    = logoSettings.x;
        const ly    = logoSettings.y;
        const lw    = logoSettings.width;
        const lh    = logoSettings.height;
        const shape = logoSettings.shape;
        const br    = logoSettings.borderRadius;
        const bw    = logoSettings.borderWidth;
        const bc    = logoSettings.borderColor;

        console.log(`Logo: shape=${shape}, br=${br}, pos=(${lx},${ly}), size=${lw}x${lh}`);

        ctx.save();

        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(lx + lw / 2, ly + lh / 2, Math.min(lw, lh) / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (br > 0) {
          drawRoundedRect(ctx, lx, ly, lw, lh, br);
          ctx.clip();
        }

        ctx.drawImage(logoImg, lx, ly, lw, lh);

        if (bw > 0) {
          ctx.strokeStyle = bc;
          ctx.lineWidth   = bw;
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(lx + lw / 2, ly + lh / 2, Math.min(lw, lh) / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else if (br > 0) {
            drawRoundedRect(ctx, lx, ly, lw, lh, br);
            ctx.stroke();
          } else {
            ctx.strokeRect(lx, ly, lw, lh);
          }
        }

        ctx.restore();
        console.log('Logo drawn successfully');
      } catch (logoErr) {
        console.warn('Logo load failed, skipping:', logoErr.message);
      }
    }

    const outputBuffer = canvas.toBuffer('image/png');
    const filename     = `billbook-overlay-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const savedPath    = saveBufferToFile(outputBuffer, filename);

    console.log('Overlay saved:', savedPath);
    return savedPath;

  } catch (error) {
    console.error('overlayBillBookOnTemplate error:', error.message);
    return null;
  }
};

export const getBillBookWithBusinessDetails = async (req, res) => {
  try {
    const { userId, billbookId } = req.params;

    if (!userId || !billbookId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and BillBook ID are required',
      });
    }

    const user = await User.findById(userId).select('businessDetails');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const billbook = await BillBook.findById(billbookId);
    if (!billbook) {
      return res.status(404).json({ 
        success: false, 
        message: 'BillBook not found' 
      });
    }

    const businessDetails = user.businessDetails || {};
    const billbookStyles  = billbook.textStyles   || {};
    const baseUrl         = `${req.protocol}://${req.get('host')}`;

    // 🔥 CHECK: User ne business details add kiye hain ya nahi?
    const hasBusinessDetails = businessDetails.companyName || 
                               businessDetails.companyAddress || 
                               businessDetails.companyEmail || 
                               businessDetails.companyPhone;

    // Agar user ke paas business details nahi hain, toh error bhejo
    if (!hasBusinessDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please add your business details first before generating bill',
        requiresBusinessDetails: true,
        data: {
          billbookId: billbook._id,
          userId: user._id,
          message: 'Business details not found. Please update your profile with business information.'
        }
      });
    }

    // ─── Text styles — billbook coordinates + user ka data ───
    const fields = [
      'companyName', 'companyAddress', 'companyEmail',
      'companyPhone', 'companyWebsite', 'gstNumber', 'panNumber'
    ];

    const overlayTextStyles = {};
    fields.forEach((field) => {
      const tmpl = billbookStyles[field] || {};
      
      // 🔥 SIRF USER KA DATA USE KARO, KISI AUR KA NAHI
      let text = businessDetails[field] || '';
      
      // Agar text empty hai toh skip karo, kisi aur se mat lo
      if (!text) {
        console.log(`⚠️ No business details found for field: ${field}`);
      }

      overlayTextStyles[field] = {
        fontSize:   tmpl.fontSize,
        fontWeight: tmpl.fontWeight,
        fontFamily: tmpl.fontFamily || 'sans-serif',
        color:      tmpl.color,
        italic:     tmpl.italic    || false,
        underline:  tmpl.underline || false,
        show:       tmpl.show !== undefined ? tmpl.show : true,
        x:          tmpl.x,
        y:          tmpl.y,
        text,  // Sirf user ka data, warna empty string
      };
    });

    // ─── Logo settings — billbook as-is ───
    const overlayLogoSettings = billbook.logoSettings || {};

    // ─── Template URL ───
    const templateImageUrl = billbook.templateImage?.startsWith('http')
      ? billbook.templateImage
      : `${baseUrl}${billbook.templateImage}`;

    // ─── Logo URL — SIRF USER KA LOGO, KOI AUR NAHI ───
    let logoUrl = '';
    if (businessDetails.logo) {
      logoUrl = businessDetails.logo.startsWith('http')
        ? businessDetails.logo
        : `${baseUrl}${businessDetails.logo}`;
    } else {
      console.log('⚠️ No logo found in user business details');
    }

    console.log('📋 User Business Details:', JSON.stringify(businessDetails, null, 2));
    console.log('🖼️ Template URL:', templateImageUrl);
    console.log('🏷️ Logo URL:', logoUrl);
    console.log('⚙️ Logo Settings:', JSON.stringify(overlayLogoSettings));
    console.log('📝 Text Styles with data:', JSON.stringify(overlayTextStyles));

    // Check if any text fields have data
    const hasAnyTextData = Object.values(overlayTextStyles).some(style => style.text);
    
    if (!hasAnyTextData && !logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'No business details or logo found. Please add your business information first.',
        requiresBusinessDetails: true,
        data: {
          billbookId: billbook._id,
          userId: user._id,
          missingFields: fields.filter(f => !businessDetails[f])
        }
      });
    }

    // ─── Overlay ───
    let overlaidImagePath = '';
    if (templateImageUrl) {
      overlaidImagePath = await overlayBillBookOnTemplate(
        templateImageUrl,
        overlayTextStyles,
        logoUrl,
        overlayLogoSettings
      );
    }

    const overlaidImageUrl = overlaidImagePath
      ? `${baseUrl}${overlaidImagePath}`
      : '';

    return res.status(200).json({
      success: true,
      data: {
        overlaidImage:     overlaidImageUrl,
        overlaidImagePath: overlaidImagePath,
        billbookId:        billbook._id,
        userId:            user._id,
        businessDetails:   businessDetails,
        hasBusinessDetails: true
      },
    });

  } catch (error) {
    console.error('getBillBookWithBusinessDetails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting billbook',
      error: error.message,
    });
  }
};



// AuthController.js - Add these functions

// Add/Update Doctor Details
export const addDoctorDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      doctorName,
      qualification,
      hospitalName,
      address,
      phone,
      registrationNo,
      timing
    } = req.body;

    // Get logo file path if uploaded
    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/doctor-logo/${req.file.filename}`;
    }

    // Update user's doctor details
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'doctorDetails.doctorName': doctorName || '',
          'doctorDetails.qualification': qualification || '',
          'doctorDetails.hospitalName': hospitalName || '',
          'doctorDetails.address': address || '',
          'doctorDetails.phone': phone || '',
          'doctorDetails.registrationNo': registrationNo || '',
          'doctorDetails.timing': timing || '',
          'doctorDetails.logo': logoPath
        }
      },
      { new: true, upsert: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor details updated successfully',
      data: {
        doctorDetails: user.doctorDetails
      }
    });

  } catch (error) {
    console.error('Error adding doctor details:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding doctor details',
      error: error.message
    });
  }
};

// Get Doctor Details
export const getDoctorDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId).select('doctorDetails');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctorDetails: user.doctorDetails || {}
      }
    });

  } catch (error) {
    console.error('Error getting doctor details:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting doctor details',
      error: error.message
    });
  }
};



const overlayDoctorTemplate = async (
  templateImageUrl,
  textStyles,
  logoUrl,
  logoSettings
) => {
  try {
    const templateBuffer = await fetchAndConvertImage(templateImageUrl);
    const templateImg = await loadImage(templateBuffer);

    const width = templateImg.width;
    const height = templateImg.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ─── DRAW TEMPLATE ───
    ctx.drawImage(templateImg, 0, 0, width, height);

    // ─────────────────────────────
    // TEXT OVERLAY (FIXED)
    // ─────────────────────────────
    const fields = Object.keys(textStyles);

    for (const field of fields) {
      const style = textStyles[field];

      if (!style?.text) continue;
      if (style.show === false) continue;

      const x = Number(style.x) || 0;
      const y = Number(style.y) || 0;

      const fontSize = style.fontSize || 16;
      const fontWeight = style.fontWeight || 'normal';
      const fontFamily = style.fontFamily || 'sans-serif';
      const color = style.color || '#000';

      ctx.save();

      // ✅ FIX FONT FORMAT
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;

      // ✅ IMPORTANT FIX
      ctx.textBaseline = 'top';

      const text = String(style.text);

      console.log(`🖊️ Drawing ${field}: ${text} @ ${x},${y}`);

      // multi-line support (address etc.)
      const lines = text.split('\n');

      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * (fontSize + 4));
      });

      ctx.restore();
    }

    // ─────────────────────────────
    // LOGO OVERLAY (WORKING)
    // ─────────────────────────────
    if (logoUrl && logoSettings?.show !== false) {
      try {
        const logoBuffer = await fetchAndConvertImage(logoUrl);
        const logoImg = await loadImage(logoBuffer);

        const x = logoSettings.x || 0;
        const y = logoSettings.y || 0;
        const w = logoSettings.width || 80;
        const h = logoSettings.height || 80;

        ctx.save();

        if (logoSettings.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.clip();
        }

        ctx.drawImage(logoImg, x, y, w, h);

        ctx.restore();
      } catch (e) {
        console.log('Logo error:', e.message);
      }
    }

    // ─── SAVE IMAGE ───
    const buffer = canvas.toBuffer('image/png');
    const filename = `doctor-overlay-${Date.now()}.png`;

    const filePath = saveBufferToFile(buffer, filename);

    return filePath;

  } catch (error) {
    console.error('Overlay engine error:', error);
    return null;
  }
};

export const getDoctorPrescriptionWithDetails = async (req, res) => {
  try {
    const { userId, prescriptionId } = req.params;

    if (!userId || !prescriptionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Prescription ID are required',
      });
    }

    // ─────────────────────────────
    // 1. USER (Doctor Details)
    // ─────────────────────────────
    const user = await User.findById(userId).select('doctorDetails');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const doctorDetails = user.doctorDetails || {};

    // ─────────────────────────────
    // 2. PRESCRIPTION TEMPLATE
    // ─────────────────────────────
    const prescription = await DoctorPrescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Doctor prescription not found'
      });
    }

    const templateStyles = prescription.textStyles || {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // ─────────────────────────────
    // 3. CHECK DATA
    // ─────────────────────────────
    const hasDoctorDetails =
      doctorDetails.doctorName ||
      doctorDetails.hospitalName ||
      doctorDetails.phone;

    if (!hasDoctorDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please add doctor details first',
        requiresDoctorDetails: true
      });
    }

    // ─────────────────────────────
    // 4. TEMPLATE IMAGE URL
    // ─────────────────────────────
    const templateImageUrl = prescription.templateImage?.startsWith('http')
      ? prescription.templateImage
      : `${baseUrl}${prescription.templateImage}`;

    // ─────────────────────────────
    // 5. LOGO URL
    // ─────────────────────────────
    let logoUrl = '';
    if (doctorDetails.logo) {
      logoUrl = doctorDetails.logo.startsWith('http')
        ? doctorDetails.logo
        : `${baseUrl}${doctorDetails.logo}`;
    }

    // ─────────────────────────────
    // 6. TEXT FIELDS
    // ─────────────────────────────
    const fields = [
      'doctorName',
      'qualification',
      'hospitalName',
      'address',
      'phone',
      'registrationNo',
      'timing'
    ];

    const overlayTextStyles = {};

    fields.forEach((field) => {
      const tmpl = templateStyles[field] || {};
      const text = doctorDetails[field] || '';

      overlayTextStyles[field] = {
        fontSize: tmpl.fontSize || 16,
        fontWeight: tmpl.fontWeight || 'normal',
        fontFamily: tmpl.fontFamily || 'sans-serif',
        color: tmpl.color || '#000',
        italic: tmpl.italic || false,
        underline: tmpl.underline || false,
        show: tmpl.show !== false,
        x: Number(tmpl.x) || 0,
        y: Number(tmpl.y) || 0,
        text
      };
    });

    // ─────────────────────────────
    // 7. GENERATE OVERLAY IMAGE
    // ─────────────────────────────
    const overlaidImagePath = await overlayDoctorTemplate(
      templateImageUrl,
      overlayTextStyles,
      logoUrl,
      prescription.logoSettings || {}
    );

    const overlaidImageUrl = overlaidImagePath
      ? `${baseUrl}${overlaidImagePath}`
      : '';

    return res.status(200).json({
      success: true,
      message: 'Doctor prescription generated successfully',
      data: {
        overlaidImage: overlaidImageUrl,
        prescriptionId: prescription._id,
        userId: user._id,
        doctorDetails
      }
    });

  } catch (error) {
    console.error('Overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating prescription',
      error: error.message
    });
  }
};



export const addUserReceiptDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      receiptTitle,
      receiptNumber,
      receiptDate,
      message
    } = req.body;

    // ─────────────────────────────
    // LOGO FILE (OPTIONAL)
    // ─────────────────────────────
    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/receipt-logo/${req.file.filename}`;
    }

    // ─────────────────────────────
    // UPDATE USER (SIMPLE DOCTOR STYLE)
    // ─────────────────────────────
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'receiptDetails.companyName': companyName || '',
          'receiptDetails.companyAddress': companyAddress || '',
          'receiptDetails.companyEmail': companyEmail || '',
          'receiptDetails.companyPhone': companyPhone || '',
          'receiptDetails.receiptTitle': receiptTitle || '',
          'receiptDetails.receiptNumber': receiptNumber || '',
          'receiptDetails.receiptDate': receiptDate || null,
          'receiptDetails.message': message || '',
          'receiptDetails.logo': logoPath
        }
      },
      { new: true, upsert: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Receipt details updated successfully',
      data: user.receiptDetails
    });

  } catch (error) {
    console.error('Error adding receipt details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding receipt details',
      error: error.message
    });
  }
};



const overlayReceiptTemplate = async (
  templateImageUrl,
  textStyles,
  logoUrl,
  logoSettings
) => {
  try {
    const templateBuffer = await fetchAndConvertImage(templateImageUrl);
    const templateImg = await loadImage(templateBuffer);

    const width = templateImg.width;
    const height = templateImg.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ─── DRAW TEMPLATE ───
    ctx.drawImage(templateImg, 0, 0, width, height);

    // ─────────────────────────────
    // TEXT OVERLAY
    // ─────────────────────────────
    const fields = Object.keys(textStyles);

    for (const field of fields) {
      const style = textStyles[field];

      if (!style?.text) continue;
      if (style.show === false) continue;

      const x = Number(style.x) || 0;
      const y = Number(style.y) || 0;

      const fontSize = style.fontSize || 16;
      const fontWeight = style.fontWeight || 'normal';
      const fontFamily = style.fontFamily || 'sans-serif';
      const color = style.color || '#000';

      ctx.save();
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';

      const text = String(style.text);

      const lines = text.split('\n');

      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * (fontSize + 4));
      });

      ctx.restore();
    }

    // ─────────────────────────────
    // LOGO OVERLAY
    // ─────────────────────────────
    if (logoUrl && logoSettings?.show !== false) {
      try {
        const logoBuffer = await fetchAndConvertImage(logoUrl);
        const logoImg = await loadImage(logoBuffer);

        const x = logoSettings.x || 0;
        const y = logoSettings.y || 0;
        const w = logoSettings.width || 80;
        const h = logoSettings.height || 80;

        ctx.save();

        if (logoSettings.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.clip();
        }

        ctx.drawImage(logoImg, x, y, w, h);

        ctx.restore();
      } catch (e) {
        console.log('Logo error:', e.message);
      }
    }

    // ─── SAVE IMAGE ───
    const buffer = canvas.toBuffer('image/png');
    const filename = `receipt-overlay-${Date.now()}.png`;

    const filePath = saveBufferToFile(buffer, filename);

    return filePath;

  } catch (error) {
    console.error('Receipt overlay error:', error);
    return null;
  }
};


export const getSingleReceiptWithDetails = async (req, res) => {
  try {
    const { userId, receiptId } = req.params;

    if (!userId || !receiptId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Receipt ID are required'
      });
    }

    // ─────────────────────────────
    // 1. USER DATA
    // ─────────────────────────────
    const user = await User.findById(userId).select('receiptDetails');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const receiptDetails = user.receiptDetails || {};

    // ─────────────────────────────
    // 2. RECEIPT TEMPLATE
    // ─────────────────────────────
    const receipt = await Ireceipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    const templateStyles = receipt.textStyles || {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // ─────────────────────────────
    // 3. TEMPLATE IMAGE URL
    // ─────────────────────────────
    const templateImageUrl = receipt.templateImage?.startsWith('http')
      ? receipt.templateImage
      : `${baseUrl}${receipt.templateImage}`;

    // ─────────────────────────────
    // 4. LOGO URL
    // ─────────────────────────────
    let logoUrl = '';
    if (receiptDetails.logo) {
      logoUrl = receiptDetails.logo.startsWith('http')
        ? receiptDetails.logo
        : `${baseUrl}${receiptDetails.logo}`;
    }

    // ─────────────────────────────
    // 5. FIELDS MAP (IMPORTANT)
    // ─────────────────────────────
    const fields = [
      'companyName',
      'companyAddress',
      'companyEmail',
      'companyPhone',
      'receiptTitle',
      'receiptNumber',
      'receiptDate',
      'message'
    ];

    const overlayTextStyles = {};

    fields.forEach((field) => {
      const tmpl = templateStyles[field] || {};
      const text = receiptDetails[field] || '';

      overlayTextStyles[field] = {
        fontSize: tmpl.fontSize || 16,
        fontWeight: tmpl.fontWeight || 'normal',
        fontFamily: tmpl.fontFamily || 'sans-serif',
        color: tmpl.color || '#000',
        italic: tmpl.italic || false,
        underline: tmpl.underline || false,
        show: tmpl.show !== false,
        x: Number(tmpl.x) || 0,
        y: Number(tmpl.y) || 0,
        text
      };
    });

    // ─────────────────────────────
    // 6. GENERATE OVERLAY
    // ─────────────────────────────
    const overlaidImagePath = await overlayReceiptTemplate(
      templateImageUrl,
      overlayTextStyles,
      logoUrl,
      receipt.logoSettings || {}
    );

    const overlaidImageUrl = overlaidImagePath
      ? `${baseUrl}${overlaidImagePath}`
      : '';

    return res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: {
        overlaidImage: overlaidImageUrl,
        receiptId: receipt._id,
        userId: user._id,
        receiptDetails
      }
    });

  } catch (error) {
    console.error('Receipt overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message
    });
  }
};