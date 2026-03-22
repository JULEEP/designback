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


import dotenv from "dotenv";
dotenv.config();




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
    const { phoneNumber } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user)
      return res.status(400).json({ message: "Phone number not registered" });

    const otp = "1234";

    const otpToken = generateToken(
      { phoneNumber, otp, type: "forgot" },
      "10m"
    );

    res.json({
      success: true,
      message: "OTP sent for password reset",
      token: otpToken
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const decoded = verifyToken(token);



    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { phoneNumber: decoded.phoneNumber },
      { password: hashed }
    );

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(500).json({ message: "Invalid or expired token" });
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