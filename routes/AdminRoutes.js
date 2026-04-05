import express from "express";
import { createBanner, createBillBook, createDoctorPrescription, createPlatformCharge, createWeddingCard, deleteAdminNotification, deleteBanner, deleteBillBook, deleteDoctorPrescription, deleteMovieName, deleteMovieTicket, deletePlatformCharge, deletePurchasedMovieTicket, deleteRedemptionRequest, deleteUser, getAdminNotifications, getAdminProfile, getAllBanners, getAllBillBooks, getAllDoctorPrescriptions, getAllMoviesNames, getAllMovieTickets, getAllPlatformCharges, getAllPurchasedMovieTickets, getAllRedemptionRequests, getAllUsers, getAllUsersMovieTickets, getAllWeddingCards, getDashboardStats, getDoctorPrescriptionById, getOngoingMovies, getReportedBookings, getSingleBillBook, getSingleMovieTicket, loginAdmin, registerAdmin, updateAdminProfile, updateBanner, updateBillBook, updateDoctorPrescription, updateMovieName, updateMovieTicket, updateMovieTicketStatus, updatePlatformCharge, updateRedemptionStatus, updateUser } from "../controllers/AdminController.js";
import { uploadBillBookFiles, uploadDoctorPrescriptionFiles, uploadWeddingCardFiles } from "../config/uploadUtils.js";

const router = express.Router();

// ➤ Create a new movie

router.delete("/deletemoviename/:id",   deleteMovieName);

// ➤ Get all movies
router.get("/allmovienames", getAllMoviesNames);

// ➤ Create a new movie ticket



router.put("/updatemovieticet/:ticketId", updateMovieTicketStatus);
router.delete("/deletemovieticet/:ticketId", deleteMovieTicket);


// ➤ Get all movie tickets
router.get("/allmovieticekts", getAllMovieTickets);
router.get("/ongoingmovies", getOngoingMovies);

router.get("/singlemovieticket/:ticketId", getSingleMovieTicket);


// Register new admin
router.post("/register", registerAdmin);

// Admin login
router.post("/login", loginAdmin);
router.get("/users", getAllUsers);
router.put("/updateusers/:userId", updateUser);
router.delete("/deleteusers/:userId", deleteUser);

router.get("/allusersmovies", getAllUsersMovieTickets);
router.get("/alluserspurchedmoviestickets", getAllPurchasedMovieTickets);

router.delete("/deletemovie-tickets/:orderId", deletePurchasedMovieTicket);

router.get("/allbanner", getAllBanners);
router.delete("/deletebanner/:bannerId", deleteBanner);


router.get('/redemption-requests', getAllRedemptionRequests);

router.put('/redemption-requestsstatus/:redemptionId', updateRedemptionStatus);
router.delete('/deleteredemption-requests/:redemptionId', deleteRedemptionRequest);

router.get("/allusersreportedmoviestickets", getReportedBookings);
router.get("/getprofile/:adminId", getAdminProfile);
router.get("/dashboard", getDashboardStats);

router.post("/createplatformcharge", createPlatformCharge);
router.get("/allplatformcharge", getAllPlatformCharges);
router.put("/updateplatformcharge/:id", updatePlatformCharge);
router.delete("/deleteplatformcharge/:id", deletePlatformCharge);
router.get("/getnotifications/:adminId", getAdminNotifications);
router.delete("/deletenotifications/:adminId/:notificationId", deleteAdminNotification);



router.post('/createbillbook', uploadBillBookFiles, createBillBook);

router.get("/allbillbooks", getAllBillBooks);
router.get("/billbook/:id", getSingleBillBook);
router.delete("/billbook/:id", deleteBillBook);
router.put('/billbook/:billBookId', updateBillBook);


// Create new doctor prescription
router.post('/createdoctorpad', uploadDoctorPrescriptionFiles, createDoctorPrescription);

// Get all doctor prescriptions (with pagination and filters)
router.get('/doctorprescriptions', getAllDoctorPrescriptions);


// Update doctor prescription
router.put('/doctorprescription/:id', uploadDoctorPrescriptionFiles, updateDoctorPrescription);



// Soft delete doctor prescription
router.delete('/doctorprescription/:id', deleteDoctorPrescription);


// Create wedding card
router.post('/createweddingcard', uploadWeddingCardFiles, createWeddingCard);

// Get all wedding cards
router.get('/weddingcards', getAllWeddingCards);



export default router;
