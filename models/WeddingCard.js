// models/WeddingCard.js
import mongoose from 'mongoose';

const weddingCardSchema = new mongoose.Schema({
  // Groom Details
  groomName: { type: String, trim: true },
  groomFatherName: { type: String, trim: true },
  groomMotherName: { type: String, trim: true },
  groomMobile: { type: String, trim: true },
  
  // Bride Details
  brideName: { type: String, required: true, trim: true },
  brideFatherName: { type: String, trim: true },
  brideMotherName: { type: String, trim: true },
  brideMobile: { type: String, trim: true },
  
  // Ceremony Details
  ceremonyDate: { type: String, trim: true },
  ceremonyTime: { type: String, trim: true },
  ceremonyVenue: { type: String, trim: true },
  ceremonyAddress: { type: String, trim: true },
  ceremonyContact: { type: String, trim: true },
  
  // Reception Details
  receptionDate: { type: String, trim: true },
  receptionTime: { type: String, trim: true },
  receptionVenue: { type: String, trim: true },
  receptionAddress: { type: String, trim: true },
  receptionContact: { type: String, trim: true },
  
  // Additional Info
  additionalInfo: { type: String, trim: true },
  dressCode: { type: String, trim: true },
  rsvpContact: { type: String, trim: true },
  rsvpBy: { type: String, trim: true },
  
  // Text Styles (Front + Inside both)
  textStyles: {
    type: Object,
    default: {}
  },
  
  // Logo Settings
  logoSettings: {
    type: Object,
    default: {
      x: 350, y: 50, width: 100, height: 100, borderRadius: 50,
      borderWidth: 0, borderColor: '#d4af37', shape: 'circle', show: true
    }
  },
  
  // Design Settings
  design: {
    type: Object,
    default: {
      backgroundColor: '#fff8f0',
      textColor: '#5a3e2b',
      accentColor: '#d4af37',
      fontFamily: 'Georgia',
      showLogo: true
    }
  },
  
  // Custom Events
  customEvents: {
    type: Array,
    default: []
  },
  
  // Relatives
  relatives: {
    type: Array,
    default: []
  },
  
  // Images - Three separate sides
  frontImage: { type: String, default: null },
  insideImage: { type: String, default: null },
  backImage: { type: String, default: null },
  
  // Preview Images
  frontPreview: { type: String, default: null },
  insidePreview: { type: String, default: null },
  backPreview: { type: String, default: null },
  
  // Logo
  logo: { type: String, default: null },
  
  // Language
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  
  // Hindi Translations
  hindiTranslations: {
    type: Object,
    default: {}
  },
  
  // Status
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  
  // Created by
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  
}, { timestamps: true });

// Indexes
weddingCardSchema.index({ groomName: 1, brideName: 1 });
weddingCardSchema.index({ status: 1 });
weddingCardSchema.index({ createdAt: -1 });

export default mongoose.model('WeddingCard', weddingCardSchema);