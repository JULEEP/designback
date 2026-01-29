import express from "express";
import {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  getMyPostedTickets,
  getUserProfile,
  addToCart,
  getCart,
  removeFromCart,
  bookTickets,
  getUserNotifications,
  updateProfile,
  deleteMovieTicket,
  myPurchasedMovieTickets,
  getWallet,
  reportOrder,
  getUserReferralCode,
  createRedemptionRequest,
  deleteUserAccount,
  deleteAccount,
  confirmDeleteAccount
} from "../controllers/AuthController.js";

import { uploadProfileImage } from "../config/uploadUtils.js";


const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get('/mypostedticket/:userId', getMyPostedTickets);
router.get('/myprofile/:userId', getUserProfile);


router.post("/addtocart", addToCart);           
router.get("/getcart/:userId", getCart);          
router.delete("/removeticketfromcart", removeFromCart); 
router.post("/booktickets", bookTickets);
router.get('/mynotification/:userId', getUserNotifications);

router.put(
  "/update-profile/:userId",
  uploadProfileImage.single("profileImage"),
  updateProfile
);

router.get('/purchasedmovietickets/:userId', myPurchasedMovieTickets);


router.delete("/deletemovieticket/:userId/:ticketId", deleteMovieTicket);

router.get('/getuserwallet/:userId', getWallet);
router.post('/reporttobooking', reportOrder);
router.get('/getuserreffralcode/:userId', getUserReferralCode);

router.post('/sendredemption/:userId', createRedemptionRequest);

router.delete('/deletemyaccount/:userId', deleteUserAccount);

router.post('/deleteaccount', deleteAccount)
router.get('/confirm-delete-account/:token', confirmDeleteAccount);





export default router;
