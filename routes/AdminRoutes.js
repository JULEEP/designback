import express from "express";
import { createBanner, createBillBook, createPlatformCharge, deleteAdminNotification, deleteBanner, deleteMovieName, deleteMovieTicket, deletePlatformCharge, deletePurchasedMovieTicket, deleteRedemptionRequest, deleteUser, getAdminNotifications, getAdminProfile, getAllBanners, getAllBillBooks, getAllMoviesNames, getAllMovieTickets, getAllPlatformCharges, getAllPurchasedMovieTickets, getAllRedemptionRequests, getAllUsers, getAllUsersMovieTickets, getDashboardStats, getOngoingMovies, getReportedBookings, getSingleBillBook, getSingleMovieTicket, loginAdmin, registerAdmin, updateAdminProfile, updateBanner, updateBillBook, updateMovieName, updateMovieTicket, updateMovieTicketStatus, updatePlatformCharge, updateRedemptionStatus, updateUser } from "../controllers/AdminController.js";
import { uploadBillBookFiles } from "../config/uploadUtils.js";

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
router.put('/billbook/:billBookId', updateBillBook);


export default router;
