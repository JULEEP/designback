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
  deleteMovieTicket,
  myPurchasedMovieTickets,
  getWallet,
  reportOrder,
  getUserReferralCode,
  createRedemptionRequest,
  deleteUserAccount,
  deleteAccount,
  confirmDeleteAccount,
  getUserById,
  addBusinessDetails,
  getBillBookWithBusinessDetails
} from "../controllers/AuthController.js";
import { uploadBusinessLogo } from "../config/uploadUtils.js";



const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get('/mypostedticket/:userId', getMyPostedTickets);
router.get('/myprofile/:userId', getUserProfile);
router.get("/user/:id", getUserById); // New route


router.post("/addtocart", addToCart);           
router.get("/getcart/:userId", getCart);          
router.delete("/removeticketfromcart", removeFromCart); 
router.post("/booktickets", bookTickets);
router.get('/mynotification/:userId', getUserNotifications);


router.get('/purchasedmovietickets/:userId', myPurchasedMovieTickets);


router.delete("/deletemovieticket/:userId/:ticketId", deleteMovieTicket);

router.get('/getuserwallet/:userId', getWallet);
router.post('/reporttobooking', reportOrder);
router.get('/getuserreffralcode/:userId', getUserReferralCode);

router.post('/sendredemption/:userId', createRedemptionRequest);

router.delete('/deletemyaccount/:userId', deleteUserAccount);

router.post('/deleteaccount', deleteAccount)
router.get('/confirm-delete-account/:token', confirmDeleteAccount);

router.post(
  '/business-details/:userId',
  uploadBusinessLogo.single('logo'),
  addBusinessDetails
);


router.get('/getbillbook/:userId/:billbookId', getBillBookWithBusinessDetails);




export default router;
