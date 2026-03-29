import Admin from "../models/Admin.js";
import CreateMovieTicket from "../models/CreateMovieTicket.js";
import Moviename from "../models/Moviename.js";
import { Order } from "../models/Order.js";
import mongoose from "mongoose";
import User from "../models/AuthModel.js"
import Banner from "../models/Banner.js";
import Redemption from "../models/Redemption.js";
import PlatformCharge from "../models/PlatformCharge.js";
import BillBook from "../models/BillBook.js";



// 👉 Create Movie
export const createMovieName = async (req, res) => {
  try {
    const { MovieName } = req.body;

    if (!MovieName) {
      return res.status(400).json({ message: "MovieName is required" });
    }

    // Check duplicate
    const exists = await Moviename.findOne({ MovieName });
    if (exists) {
      return res.status(400).json({ message: "Movie already exists" });
    }

    // Image path (optional)
    let image = null;
    if (req.file) {
      image = `/uploads/movies/${req.file.filename}`;
    }

    const movie = await Moviename.create({
      MovieName,
      image
    });

    res.status(201).json({
      message: "Movie created successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



export const updateMovieName = async (req, res) => {
  try {
    const { id } = req.params;
    const { MovieName } = req.body;

    // Check movie exists
    const movie = await Moviename.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Duplicate name check (if MovieName provided)
    if (MovieName) {
      const exists = await Moviename.findOne({
        MovieName,
        _id: { $ne: id }
      });
      if (exists) {
        return res.status(400).json({ message: "Movie name already exists" });
      }
      movie.MovieName = MovieName;
    }

    // Update image if provided
    if (req.file) {
      movie.image = `/uploads/movies/${req.file.filename}`;
    }

    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const deleteMovieName = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Moviename.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    await Moviename.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



// 👉 Get All Movies
export const getAllMoviesNames = async (req, res) => {
    try {
        const movies = await Moviename.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: "Movies fetched successfully",
            movies
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};



// 👉 Create a Movie Ticket
export const createMovieTicket = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      movieId,
      fullName,
      phoneNumber,
      email,
      MovieName,
      language,
      theatrePlace,
      showDate,
      showTime,
      ticketCategory,
      noOfTickets,
      selectedSeats,
      pricePerTicket,
      totalPrice,
      qrCodeLink,
      termsAndConditionsAccepted,

      // ✅ NEW FIELDS
      ticketType,
      screen
    } = req.body;

    // ✅ Validation (existing + new string fields)
    const requiredFields = [
      movieId, fullName, phoneNumber, email, MovieName,
      language, theatrePlace, showDate, showTime,
      ticketCategory, noOfTickets, selectedSeats,
      pricePerTicket, totalPrice,
      ticketType,     // ✅ added
      screen          // ✅ added
    ];

    if (requiredFields.some(field => !field) || termsAndConditionsAccepted === undefined) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // ✅ Ticket image required (already existing)
    if (!req.files || !req.files.ticketImage) {
      return res.status(400).json({
        success: false,
        message: "Ticket image is required"
      });
    }

    // ✅ QR Code image required (NEW)
    if (!req.files.qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR Code image is required"
      });
    }

    // 🔥 ONLY relative paths
    const ticketImage = `/uploads/tickets/${req.files.ticketImage[0].filename}`;
    const qrCodeImage = `/uploads/qrcodes/${req.files.qrCode[0].filename}`;

    // ✅ selectedSeats parse (agar string ho)
    let parsedSeats = selectedSeats;
    if (typeof selectedSeats === "string") {
      parsedSeats = JSON.parse(selectedSeats);
    }

    const ticket = await CreateMovieTicket.create({
      userId,
      movieId,
      fullName,
      phoneNumber,
      email,
      MovieName,
      language,
      theatrePlace,
      showDate,
      showTime,
      ticketCategory,
      noOfTickets: Number(noOfTickets),
      selectedSeats: parsedSeats,
      pricePerTicket: Number(pricePerTicket),
      totalPrice: Number(totalPrice),

      ticketImage,        // existing
      qrCode: qrCodeImage, // ✅ NEW (file)

      qrCodeLink: qrCodeLink || "",
      ticketType,          // ✅ NEW (string)
      screen,              // ✅ NEW (string)

      termsAndConditionsAccepted:
        termsAndConditionsAccepted === true ||
        termsAndConditionsAccepted === "true"
    });


       // 1️⃣ Push notification to user
    const user = await User.findById(userId);
if (user) {
  user.notifications = user.notifications || [];
  user.notifications.push({
    message: `🎟️ Your ticket for "${ticket.MovieName}" has been successfully created! It's now awaiting admin verification. You'll be notified once it's verified. Thank you for booking!`,
    ticketId: ticket._id,
    status: "created",
    createdAt: new Date()
  });
  await user.save();
}

   // 2️⃣ Push notification to all admins
const admins = await Admin.find(); // ✅ no role check
for (const admin of admins) {
  admin.notifications = admin.notifications || [];
  admin.notifications.push({
    message: `🔔 A new ticket for "${ticket.MovieName}" has been created by ${fullName || user.email}. Please review and verify it.`,
    ticketId: ticket._id,
    status: "created",
    createdAt: new Date()
  });
  await admin.save();
}




    return res.status(201).json({
      success: true,
      message: "Movie ticket created successfully",
      data: ticket
    });

  } catch (error) {
    console.error("Ticket creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const updateMovieTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // 🔍 Find existing ticket
    const ticket = await CreateMovieTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // 🧠 Fields allowed to update
    const updatableFields = [
      "movieId",
      "fullName",
      "phoneNumber",
      "email",
      "MovieName",
      "language",
      "theatrePlace",
      "showDate",
      "showTime",
      "ticketCategory",
      "noOfTickets",
      "selectedSeats",
      "pricePerTicket",
      "totalPrice",
      "qrCodeLink",
      "ticketType",
      "screen",
      "termsAndConditionsAccepted"
    ];

    // 🔁 Update only provided fields
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {

        // selectedSeats string → JSON
        if (field === "selectedSeats" && typeof req.body[field] === "string") {
          ticket[field] = JSON.parse(req.body[field]);
        }

        // Boolean fix
        else if (field === "termsAndConditionsAccepted") {
          ticket[field] =
            req.body[field] === true ||
            req.body[field] === "true";
        }

        // Numbers fix
        else if (
          ["noOfTickets", "pricePerTicket", "totalPrice"].includes(field)
        ) {
          ticket[field] = Number(req.body[field]);
        }

        // Normal assignment
        else {
          ticket[field] = req.body[field];
        }
      }
    });

    // 🖼️ Update ticket image (optional)
    if (req.files?.ticketImage?.[0]) {
      ticket.ticketImage = `/uploads/tickets/${req.files.ticketImage[0].filename}`;
    }

    // 🧾 Update QR code image (optional)
    if (req.files?.qrCode?.[0]) {
      ticket.qrCode = `/uploads/qrcodes/${req.files.qrCode[0].filename}`;
    }

    // 💾 Save updates
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Movie ticket updated successfully",
      data: ticket
    });

  } catch (error) {
    console.error("Ticket update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};






export const updateMovieTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // 1️⃣ Find ticket
    const ticket = await CreateMovieTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Movie ticket not found"
      });
    }

    // 2️⃣ Check if trying to cancel an active ticket
    let statusChanged = true; // flag to know if actual status update happened
    if (ticket.status === "active" && status === "cancelled") {
      statusChanged = false; // don't change status
    } else {
      ticket.status = status;
      await ticket.save();
    }

    // 3️⃣ Prepare attractive messages
    let userMessage = "";
    if (!statusChanged) {
      userMessage = `⚠️ Attempted to cancel your ACTIVE ticket for "${ticket.MovieName}", but ACTIVE tickets cannot be cancelled.`;
    } else {
      switch (status) {
        case "active":
          userMessage = `🎉 Your ticket for "${ticket.MovieName}" is now ACTIVE! Get ready to enjoy the show!`;
          break;
        case "cancelled":
          userMessage = `⚠️ Your ticket for "${ticket.MovieName}" has been CANCELLED. If you have any questions, please contact support.`;
          break;
        case "sold":
          userMessage = `✅ Your ticket for "${ticket.MovieName}" has been SOLD out. Thank you for booking!`;
          break;
        default:
          userMessage = `ℹ️ The status of your ticket for "${ticket.MovieName}" has been updated to "${status}".`;
      }
    }

    // 4️⃣ Push notification to user
    if (ticket.userId) {
      const user = await User.findById(ticket.userId);
      if (user) {
        user.notifications = user.notifications || [];
        user.notifications.push({
          message: userMessage,
          ticketId: ticket._id,
          status: status,
          createdAt: new Date()
        });
        await user.save();
      }
    }

    // 5️⃣ Admin notifications
    const adminMessage = statusChanged
      ? `🔔 Ticket for "${ticket.MovieName}" booked by ${ticket.fullName} has been updated to "${status}". Please review if needed.`
      : `⚠️ Attempted to cancel ACTIVE ticket for "${ticket.MovieName}" booked by ${ticket.fullName}. Status not changed.`;
    
    const admins = await Admin.find();
    for (const admin of admins) {
      admin.notifications = admin.notifications || [];
      admin.notifications.push({
        message: adminMessage,
        ticketId: ticket._id,
        status: status,
        createdAt: new Date()
      });
      await admin.save();
    }

    // 6️⃣ Return response
    return res.status(200).json({
      success: true,
      message: statusChanged
        ? "Ticket status updated successfully"
        : "Cannot cancel an ACTIVE ticket, status not changed",
      data: ticket
    });

  } catch (error) {
    console.error("Update ticket status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};




export const deleteMovieTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // 1️⃣ Find ticket
    const ticket = await CreateMovieTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Movie ticket not found"
      });
    }

    // 2️⃣ Check if ticket is active
    let deletionAllowed = true;
    if (ticket.status === "active") {
      deletionAllowed = false;
    }

    // 3️⃣ Delete ticket if allowed
    if (deletionAllowed) {
      await CreateMovieTicket.findByIdAndDelete(ticketId);
    }

    // 4️⃣ Prepare messages
    let userMessage = "";
    if (deletionAllowed) {
      userMessage = `🗑️ Your ticket for "${ticket.MovieName}" has been successfully deleted.`;
    } else {
      userMessage = `⚠️ Your ticket for "${ticket.MovieName}" is ACTIVE and cannot be deleted.`;
    }

    // 5️⃣ Push notification to user
    if (ticket.userId) {
      const user = await User.findById(ticket.userId);
      if (user) {
        user.notifications = user.notifications || [];
        user.notifications.push({
          message: userMessage,
          ticketId: ticket._id,
          status: deletionAllowed ? "deleted" : ticket.status,
          createdAt: new Date()
        });
        await user.save();
      }
    }

    // 6️⃣ Admin notifications
    const adminMessage = deletionAllowed
      ? `🗑️ Ticket for "${ticket.MovieName}" created by ${ticket.fullName} has been deleted.`
      : `⚠️ Attempted to delete ACTIVE ticket for "${ticket.MovieName}" created by ${ticket.fullName}. Deletion blocked.`;

    const admins = await Admin.find();
    for (const admin of admins) {
      admin.notifications = admin.notifications || [];
      admin.notifications.push({
        message: adminMessage,
        ticketId: ticket._id,
        status: deletionAllowed ? "deleted" : ticket.status,
        createdAt: new Date()
      });
      await admin.save();
    }

    // 7️⃣ Return response
    return res.status(200).json({
      success: deletionAllowed,
      message: deletionAllowed
        ? "Movie ticket deleted successfully"
        : "Cannot delete an ACTIVE ticket, deletion blocked",
    });

  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



// 👉 Get All Movie Tickets (ONLY AVAILABLE & NOT BOOKED BY USER)
export const getAllMovieTickets = async (req, res) => {
  try {
    const { movienameId, showDate } = req.query; // ✅ showDate optional

    if (!movienameId) {
      return res.status(400).json({
        success: false,
        message: "movienameId is required in query"
      });
    }

    const now = new Date();

    // Build query
    const query = {
      movieId: new mongoose.Types.ObjectId(movienameId),
      noOfTickets: { $gt: 0 },
      status: "active" // ✅ only active tickets
    };

    // Optional showDate filter
    if (showDate) {
      const date = new Date(showDate);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      query.showDate = {
        $gte: date,
        $lt: nextDay
      };
    }

    // 1️⃣ Fetch tickets
    const tickets = await CreateMovieTicket.find(query)
      .populate("movieId", "MovieName image") // populate name + image
      .sort({ createdAt: -1 });

    // 2️⃣ Filter expired shows (showDate + showTime)
    const validTickets = tickets.filter(ticket => {
      if (!ticket.showDate || !ticket.showTime) return false;

      // ✅ Parse showTime
      let [time, modifier] = ticket.showTime.split(" "); // e.g., "03:06 PM"
      if (!modifier) modifier = "AM"; // handle case "03:06"
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

      const showDateTime = new Date(ticket.showDate);
      showDateTime.setHours(hours);
      showDateTime.setMinutes(minutes);
      showDateTime.setSeconds(0);
      showDateTime.setMilliseconds(0);

      // ✅ Only future shows
      return showDateTime > now;
    });

    // 3️⃣ No valid tickets
    if (validTickets.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No active movie tickets available",
        tickets: []
      });
    }

    // 4️⃣ Success
    return res.status(200).json({
      success: true,
      message: "Movie tickets fetched successfully",
      tickets: validTickets
    });

  } catch (error) {
    console.error("❌ Error fetching movie tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get Single Movie Ticket by ID
export const getSingleMovieTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId) {
            return res.status(400).json({
                message: "ticketId is required"
            });
        }

        const ticket = await CreateMovieTicket.findById(ticketId)
            .populate("movieId", "MovieName");

        if (!ticket) {
            return res.status(404).json({
                message: "Movie ticket not found"
            });
        }

        res.status(200).json({
            message: "Movie ticket fetched successfully",
            ticket
        });

    } catch (error) {
        console.error("Error fetching single movie ticket:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


export const getOngoingMovies = async (req, res) => {
  try {
    const BASE_URL = "http://31.97.206.144:8127";

    const now = new Date();

    // 📅 Today start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 📅 Next 7 days end
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    // 1️⃣ Fetch tickets in next 7 days AND active status
    const ongoingMovies = await CreateMovieTicket.find({
      showDate: { $gte: today, $lte: nextWeek },
      status: "active",
      noOfTickets: { $gt: 0 }
    })
      .populate("movieId", "MovieName image")
      .sort({ showDate: 1 });

    // 2️⃣ Filter tickets whose showTime + showDate is already past
    const validTickets = ongoingMovies.filter(ticket => {
      if (!ticket.showDate || !ticket.showTime) return false;

      // Parse showTime
      let [time, modifier] = ticket.showTime.split(" "); // "03:06 PM"
      if (!modifier) modifier = "AM"; // handle "03:06"
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

      const showDateTime = new Date(ticket.showDate);
      showDateTime.setHours(hours);
      showDateTime.setMinutes(minutes);
      showDateTime.setSeconds(0);
      showDateTime.setMilliseconds(0);

      return showDateTime > now;
    });

    // 3️⃣ Fix image URLs
    const ticketsWithCorrectImage = validTickets.map(ticket => {
      const obj = ticket.toObject();

      if (obj.ticketImage) {
        obj.ticketImage = obj.ticketImage.replace("http://localhost:8127", BASE_URL);
      }

      if (obj.qrCode) {
        obj.qrCode = obj.qrCode.replace("http://localhost:8127", BASE_URL);
      }

      return obj;
    });

    // 4️⃣ Response
    return res.status(200).json({
      success: ticketsWithCorrectImage.length > 0,
      message: ticketsWithCorrectImage.length > 0
        ? "Ongoing movies (next 7 days) fetched successfully"
        : "No ongoing movie tickets available",
      total: ticketsWithCorrectImage.length,
      tickets: ticketsWithCorrectImage
    });

  } catch (error) {
    console.error("❌ Get ongoing movies error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      total: 0,
      tickets: []
    });
  }
};



// Register new admin
// Register new admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
      mobile,
    });

    // Save the admin to the database
    await admin.save();

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and Password are required" });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Compare the password (no hashing in this simple version)
    if (admin.password !== password) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Send the admin's data in the response
    return res.status(200).json({
      success: true,
      admin: {
        adminId: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone, // If available, add any other fields
        // Add other fields if you want to send more info
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



// Get all users
export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find();
        
        // Send the list of users as a response
        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update a user's details
export const updateUser = async (req, res) => {
    const { userId } = req.params; // Get userId from request params
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber)
        return res.status(400).json({ message: "All fields are required" });

    try {
        // Find the user by their ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If password is provided, hash it
        let hashedPassword = user.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update user data
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.phoneNumber = phoneNumber;
        user.password = hashedPassword; // Update password if provided

        // Save the updated user data
        await user.save();

        // Send response with the updated user details
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a user by ID
export const deleteUser = async (req, res) => {
    const { userId } = req.params; // Get userId from request params

    try {
        // Find and delete the user by their ID
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Send response indicating that the user was deleted
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// Get all movie tickets
export const getAllUsersMovieTickets = async (req, res) => {
  try {
    // Fetch all movie tickets and populate the userId and movieId fields
    const movieTickets = await CreateMovieTicket.find()
      .populate('userId', 'fullName email phoneNumber') // Populate userId with user details (fullName, email, phoneNumber)
      .populate('movieId', 'MovieName image'); // Populate movieId with movie details (MovieName and image)

    if (movieTickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No movie tickets found"
      });
    }

    // Send the response with movie ticket data including user and movie information
    res.status(200).json({
      success: true,
      message: "Movie tickets retrieved successfully",
      data: movieTickets
    });
  } catch (err) {
    console.error("Error fetching movie tickets:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};




export const getAllPurchasedMovieTickets = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No purchased tickets found",
        totalOrders: 0,
        orders: []
      });
    }

    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      user: order.userId,
      transactionId: order.transactionId,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      razorpayStatus: order.razorpayStatus,
      orderStatus: order.orderStatus,
      isReported: order.isReported, // ✅ ADDED
      createdAt: order.createdAt,
      tickets: order.tickets
    }));

    return res.status(200).json({
      success: true,
      message: "All purchased movie tickets fetched successfully",
      totalOrders: formattedOrders.length,
      orders: formattedOrders
    });

  } catch (error) {
    console.error("❌ Error fetching all purchased orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const deletePurchasedMovieTicket = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required in params"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    await Order.findByIdAndDelete(orderId);

    return res.status(200).json({
      success: true,
      message: "Purchased movie ticket deleted successfully",
      deletedOrderId: orderId
    });

  } catch (error) {
    console.error("❌ Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required"
      });
    }

    const image = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({ image });

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalBanners: banners.length,
      banners
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required"
      });
    }

    const image = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { image },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const banner = await Banner.findByIdAndDelete(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


export const getAllRedemptionRequests = async (req, res) => {
  try {
    // Fetch all redemption requests
    const redemptionRequests = await Redemption.find()
      .populate("userId", "fullName email phoneNumber") // Assuming userId references User model
      .sort({ createdAt: -1 }); // Sort by latest

    if (redemptionRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No redemption requests found",
        redemptionRequests: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Redemption requests fetched successfully",
      redemptionRequests
    });

  } catch (error) {
    console.error("❌ Error fetching redemption requests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const updateRedemptionStatus = async (req, res) => {
  try {
    const { redemptionId } = req.params; // Redemption ID from params
    const { status } = req.body; // New status from request body

    // Validate the status
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses are 'pending', 'approved', 'rejected', 'completed'."
      });
    }

    // Find redemption request by ID
    const redemptionRequest = await Redemption.findById(redemptionId);
    if (!redemptionRequest) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found"
      });
    }

    // Update status
    redemptionRequest.status = status;
    await redemptionRequest.save();

    return res.status(200).json({
      success: true,
      message: `Redemption request status updated to '${status}'`,
      redemptionRequest
    });

  } catch (error) {
    console.error("❌ Error updating redemption status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const deleteRedemptionRequest = async (req, res) => {
  try {
    const { redemptionId } = req.params; // Redemption ID from params

    // Find and delete the redemption request
    const redemptionRequest = await Redemption.findByIdAndDelete(redemptionId);

    if (!redemptionRequest) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Redemption request deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting redemption request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const getReportedBookings = async (req, res) => {
  try {
    // Fetch all orders where isReported is true
    const orders = await Order.find({ isReported: true })
      .populate("userId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reported bookings found",
        totalOrders: 0,
        orders: []
      });
    }

    // Format the response
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      user: order.userId,
      transactionId: order.transactionId,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      razorpayStatus: order.razorpayStatus,
      orderStatus: order.orderStatus,
      isReported: order.isReported,
      createdAt: order.createdAt,
      tickets: order.tickets
    }));

    return res.status(200).json({
      success: true,
      message: "Reported bookings fetched successfully",
      totalOrders: formattedOrders.length,
      orders: formattedOrders
    });

  } catch (error) {
    console.error("❌ Error fetching reported bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};




export const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required in params",
      });
    }

    // Include password this time
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      admin,
    });

  } catch (error) {
    console.error("❌ Error fetching admin profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



export const updateAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, password } = req.body;

    const updatedData = {};

    // Update fields if provided
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (password) updatedData.password = password;

    // Check if profile image exists in the request (file uploaded)
    if (req.file) {
      updatedData.profileImage = `/uploads/admins/${req.file.filename}`;
    }

    // Update the admin profile in the database
    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updatedData, {
      new: true, // Return the updated document
    });

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("❌ Error updating admin profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



export const getDashboardStats = async (req, res) => {
  try {
    // 1️⃣ Total counts
    const totalBanners = await Banner.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalMovies = await Moviename.countDocuments();
    const totalMovieTickets = await CreateMovieTicket.countDocuments();
    const totalMovieBookings = await Order.countDocuments();

    // 2️⃣ Latest movie bookings (latest 5)
    const latestMovieBookings = await Order.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    // 3️⃣ Latest uploaded movie tickets (latest 5)
    const latestUploadedTickets = await CreateMovieTicket.find()
      .populate("movieId", "MovieName image")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      stats: {
        totalBanners,
        totalUsers,
        totalMovies,
        totalMovieTickets,
        totalMovieBookings,
        latestMovieBookings,
        latestUploadedTickets,
      },
    });

  } catch (error) {
    console.error("❌ Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



// ✅ Create Platform Charge
export const createPlatformCharge = async (req, res) => {
  try {
    const { platformCharge } = req.body;

    if (platformCharge == null) {
      return res.status(400).json({
        success: false,
        message: "platformCharge field is required",
      });
    }

    const newCharge = await PlatformCharge.create({ platformCharge });

    res.status(201).json({
      success: true,
      message: "Platform charge created successfully",
      platformCharge: newCharge,
    });
  } catch (error) {
    console.error("❌ PlatformCharge Creation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get Platform Charges (all)
export const getAllPlatformCharges = async (req, res) => {
  try {
    const charges = await PlatformCharge.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalCharges: charges.length,
      platformCharges: charges,
    });
  } catch (error) {
    console.error("❌ Get PlatformCharges Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Update Platform Charge
export const updatePlatformCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { platformCharge } = req.body;

    if (platformCharge == null) {
      return res.status(400).json({
        success: false,
        message: "platformCharge field is required for update",
      });
    }

    const updatedCharge = await PlatformCharge.findByIdAndUpdate(
      id,
      { platformCharge },
      { new: true }
    );

    if (!updatedCharge) {
      return res.status(404).json({
        success: false,
        message: "Platform charge not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform charge updated successfully",
      platformCharge: updatedCharge,
    });
  } catch (error) {
    console.error("❌ Update PlatformCharge Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Delete Platform Charge
export const deletePlatformCharge = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCharge = await PlatformCharge.findByIdAndDelete(id);

    if (!deletedCharge) {
      return res.status(404).json({
        success: false,
        message: "Platform charge not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform charge deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete PlatformCharge Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


export const getAdminNotifications = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required in params"
      });
    }

    // ✅ Fetch admin notifications & populate ticketId
    const admin = await Admin.findById(adminId).populate({
      path: "notifications.ticketId",
      select: "MovieName language theatrePlace showDate showTime"
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // ✅ Sort notifications (latest first)
    const notifications = (admin.notifications || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      message: "Admin notifications fetched successfully",
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error("❌ Error fetching admin notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


export const deleteAdminNotification = async (req, res) => {
  try {
    const { adminId, notificationId } = req.params;

    if (!adminId || !notificationId) {
      return res.status(400).json({
        success: false,
        message: "adminId and notificationId are required"
      });
    }

    // 1️⃣ Find admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // 2️⃣ Check notification exists
    const notificationExists = admin.notifications.id(notificationId);

    if (!notificationExists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // 3️⃣ Remove notification
    admin.notifications.pull(notificationId);
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting admin notification:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



// Create Bill Book
export const createBillBook = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    console.log('Request Files:', req.files);

    const {
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      customerName,
      customerAddress,
      customerEmail,
      customerPhone,
      textStyles,
      logoSettings,
      design,
      useTemplate
    } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Get file paths from uploaded files
    let templateImagePath = null;
    let logoPath = null;
    let previewImagePath = null;

    if (req.files) {
      if (req.files.templateImage) {
        templateImagePath = `/uploads/billbook/${req.files.templateImage[0].filename}`;
      }
      if (req.files.logo) {
        logoPath = `/uploads/billbook/${req.files.logo[0].filename}`;
      }
      if (req.files.previewImage) {
        previewImagePath = `/uploads/billbook/${req.files.previewImage[0].filename}`;
      }
    }

    // Parse JSON strings
    let parsedTextStyles = textStyles;
    let parsedLogoSettings = logoSettings;
    let parsedDesign = design;

    if (typeof textStyles === 'string') {
      try {
        parsedTextStyles = JSON.parse(textStyles);
      } catch (e) {
        parsedTextStyles = {};
      }
    }

    if (typeof logoSettings === 'string') {
      try {
        parsedLogoSettings = JSON.parse(logoSettings);
      } catch (e) {
        parsedLogoSettings = {};
      }
    }

    if (typeof design === 'string') {
      try {
        parsedDesign = JSON.parse(design);
      } catch (e) {
        parsedDesign = {};
      }
    }

    // Create bill book
    const billBook = new BillBook({
      companyName,
      companyAddress: companyAddress || '',
      companyEmail: companyEmail || '',
      companyPhone: companyPhone || '',
      customerName: customerName || '',
      customerAddress: customerAddress || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      textStyles: parsedTextStyles,
      logoSettings: parsedLogoSettings,
      design: parsedDesign,
      useTemplate: useTemplate === 'true' || useTemplate === true,
      templateImage: templateImagePath,
      logo: logoPath,
      previewImage: previewImagePath,
      createdBy: req.user?._id || null
    });

    await billBook.save();

    res.status(201).json({
      success: true,
      message: 'Bill book created successfully',
      data: billBook
    });

  } catch (error) {
    console.error('Error creating bill book:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bill book',
      error: error.message
    });
  }
};





export const getAllBillBooks = async (req, res) => {
  try {
    console.log("=== GET ALL BILLBOOKS START ===");

    const billBooks = await BillBook.find()
      .sort({ createdAt: -1 }); // latest first

    console.log("Total BillBooks found:", billBooks.length);

    return res.status(200).json({
      success: true,
      count: billBooks.length,
      data: billBooks
    });

  } catch (error) {
    console.error("Get BillBooks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getSingleBillBook = async (req, res) => {
  try {
    console.log("=== GET SINGLE BILLBOOK START ===");

    const { id } = req.params;

    const billBook = await BillBook.findById(id);

    if (!billBook) {
      return res.status(404).json({
        success: false,
        message: "BillBook not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: billBook
    });

  } catch (error) {
    console.error("Get Single BillBook error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const updateBillBook = async (req, res) => {
  try {
    console.log("=== UPDATE REQUEST START ===");
    console.log("Request body:", req.body);

    const { billBookId } = req.params;

    // Check if the BillBook ID is provided
    if (!billBookId) {
      return res.status(400).json({
        success: false,
        message: "BillBook ID is required"
      });
    }

    // Check if at least one of file or text elements is provided
    const { textElements, isEdited } = req.body;

    // Parse isEdited properly
    const isEditedBool = isEdited === 'true' || isEdited === true || isEdited === '1';

    let parsedTextElements = [];
    
    // Check if textElements exists and handle it properly
    if (textElements) {
      // If textElements is already an array (from JSON request)
      if (Array.isArray(textElements)) {
        parsedTextElements = textElements;
      }
      // If textElements is a string (from FormData/stringified JSON)
      else if (typeof textElements === 'string' && textElements.trim() !== '') {
        try {
          parsedTextElements = JSON.parse(textElements);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Error parsing textElements"
          });
        }
      }
    }

    // If textElements exist, force isEdited to true
    const finalIsEdited = parsedTextElements.length > 0 ? true : isEditedBool;

    // Find the BillBook by ID
    const existingBillBook = await BillBook.findById(billBookId);
    if (!existingBillBook) {
      return res.status(404).json({
        success: false,
        message: "BillBook not found"
      });
    }

    // Update text elements based on the provided data
    const updatedTextElements = existingBillBook.textElements.map(item => {
      const updatedItem = parsedTextElements.find(updated => updated.id === item.id);
      return updatedItem ? updatedItem : item;  // Replace if exists, else keep original
    });

    // File update logic: Always update image with text (not just when file is uploaded)
    let updatedFilePath = existingBillBook.file; // Keep the old file by default

    // Always update image with new text, even if no new file is uploaded
    if (parsedTextElements.length > 0) {
      try {
        updatedFilePath = await updateImageWithText(
          existingBillBook.file,
          parsedTextElements
        );
        console.log("Image updated successfully:", updatedFilePath);
      } catch (error) {
        console.error("Error updating image:", error);
        // Don't fail the whole request if image update fails
      }
    }

    // Update the BillBook in the database
    const updatedBillBook = await BillBook.findByIdAndUpdate(
      billBookId,
      {
        textElements: updatedTextElements,
        isEdited: finalIsEdited,  // Update the isEdited field based on textElements
        file: updatedFilePath,    // Update the file path if the image is updated
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: updatedBillBook.isEdited
        ? "✅ Edited BillBook updated successfully!"
        : "✅ BillBook updated successfully!",
      data: updatedBillBook
    });

  } catch (error) {
    console.error("Error updating BillBook:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to overlay text on the image
const updateImageWithText = async (filePath, textElements) => {
  try {
    // Read the original image to get its dimensions
    const imageMetadata = await sharp(filePath).metadata();
    const imageWidth = imageMetadata.width;
    const imageHeight = imageMetadata.height;
    
    console.log("Image dimensions:", imageWidth, "x", imageHeight);
    console.log("Text elements to overlay:", textElements.length);

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'uploads', 'updatedBillbook');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `updated_${Date.now()}.png`);

    // Create a sharp instance for the original image
    const image = sharp(filePath);
    
    // Create SVG overlays for each text element
    const overlays = [];

    for (const textElement of textElements) {
      // Scale the normalized coordinates (0-1) to actual image coordinates
      const textX = textElement.x * imageWidth;
      const textY = textElement.y * imageHeight;
      
      // Create SVG with proper dimensions
      const svgText = `
        <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .text-element {
              font-family: '${textElement.fontFamily}';
              font-size: ${textElement.fontSize}px;
              fill: ${textElement.color};
              font-weight: ${textElement.isBold ? 'bold' : 'normal'};
              font-style: ${textElement.isItalic ? 'italic' : 'normal'};
              text-decoration: ${textElement.isUnderline ? 'underline' : 'none'};
            }
          </style>
          <text x="${textX}" y="${textY}" class="text-element">
            ${textElement.text}
          </text>
        </svg>
      `;

      overlays.push({
        input: Buffer.from(svgText),
        top: 0,
        left: 0
      });
    }

    // Composite all overlays onto the image
    const imageWithText = await image.composite(overlays).toBuffer();
    
    // Save the final image
    await sharp(imageWithText).toFile(outputFilePath);

    console.log("Updated image saved to:", outputFilePath);
    return outputFilePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes for URL

  } catch (error) {
    console.error("Error while updating image with text:", error);
    throw error;
  }
};