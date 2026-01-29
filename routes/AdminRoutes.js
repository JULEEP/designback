import express from "express";
import { createBanner, createMovieName, createMovieTicket, createPlatformCharge, deleteAdminNotification, deleteBanner, deleteMovieName, deleteMovieTicket, deletePlatformCharge, deletePurchasedMovieTicket, deleteRedemptionRequest, deleteUser, getAdminNotifications, getAdminProfile, getAllBanners, getAllBillBooks, getAllMoviesNames, getAllMovieTickets, getAllPlatformCharges, getAllPurchasedMovieTickets, getAllRedemptionRequests, getAllUsers, getAllUsersMovieTickets, getDashboardStats, getOngoingMovies, getReportedBookings, getSingleBillBook, getSingleMovieTicket, loginAdmin, registerAdmin, updateAdminProfile, updateBanner, updateBillBook, updateMovieName, updateMovieTicket, updateMovieTicketStatus, updatePlatformCharge, updateRedemptionStatus, updateUser, uploadBillBook } from "../controllers/AdminController.js";
import { uploadAdminProfileImage, uploadBannerImage, uploadBillBookFile, uploadMovieFiles, uploadMovieNameImage, uploadTicketImage } from "../config/uploadUtils.js";

const router = express.Router();

// ➤ Create a new movie
router.post("/createmoviename",   uploadMovieNameImage.single("image"), createMovieName);

router.put("/updatemoviename/:id",   uploadMovieNameImage.single("image"), updateMovieName);
router.delete("/deletemoviename/:id",   deleteMovieName);

// ➤ Get all movies
router.get("/allmovienames", getAllMoviesNames);

// ➤ Create a new movie ticket
router.post("/createmovie/:userId",  uploadMovieFiles.fields([ { name: "ticketImage", maxCount: 1 },{ name: "qrCode", maxCount: 1 }]), createMovieTicket);

router.patch("/updatemovie/:ticketId", uploadMovieFiles.fields([{ name: "ticketImage", maxCount: 1 },{ name: "qrCode", maxCount: 1 }]), updateMovieTicket);


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

router.post("/createbanner", uploadBannerImage.single("image"), createBanner);
router.get("/allbanner", getAllBanners);
router.put("/updatebanner/:bannerId", uploadBannerImage.single("image"), updateBanner);
router.delete("/deletebanner/:bannerId", deleteBanner);


router.get('/redemption-requests', getAllRedemptionRequests);

router.put('/redemption-requestsstatus/:redemptionId', updateRedemptionStatus);
router.delete('/deleteredemption-requests/:redemptionId', deleteRedemptionRequest);

router.get("/allusersreportedmoviestickets", getReportedBookings);
router.get("/getprofile/:adminId", getAdminProfile);
router.put("/updateProfile/:adminId", uploadAdminProfileImage.single("profileImage"), updateAdminProfile);
router.get("/dashboard", getDashboardStats);

router.post("/createplatformcharge", createPlatformCharge);
router.get("/allplatformcharge", getAllPlatformCharges);
router.put("/updateplatformcharge/:id", updatePlatformCharge);
router.delete("/deleteplatformcharge/:id", deletePlatformCharge);
router.get("/getnotifications/:adminId", getAdminNotifications);
router.delete("/deletenotifications/:adminId/:notificationId", deleteAdminNotification);


router.post("/billbookupload", uploadBillBookFile.single("file"), uploadBillBook);
router.get("/allbillbooks", getAllBillBooks);
router.get("/billbook/:id", getSingleBillBook);
router.put('/billbook/:billBookId', updateBillBook);


export default router;
