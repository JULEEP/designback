// models/DoctorPrescription.js
import mongoose from 'mongoose';

const doctorPrescriptionSchema = new mongoose.Schema({
  // Doctor Information
  doctorName: { type: String, trim: true },
  qualification: { type: String, trim: true },
  hospitalName: { type: String, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  registrationNo: { type: String, trim: true },
  timing: { type: String, trim: true },
  
  // Text Styles for each field
  textStyles: {
    type: Object,
    default: {
      doctorName: { fontSize: 28, fontWeight: 'bold', color: '#2c7da0', italic: false, underline: false, x: 400, y: 180, show: true },
      qualification: { fontSize: 16, fontWeight: 'normal', color: '#666666', italic: false, underline: false, x: 400, y: 220, show: true },
      hospitalName: { fontSize: 22, fontWeight: 'bold', color: '#2c7da0', italic: false, underline: false, x: 400, y: 260, show: true },
      address: { fontSize: 13, fontWeight: 'normal', color: '#666666', italic: false, underline: false, x: 400, y: 300, show: true },
      phone: { fontSize: 13, fontWeight: 'normal', color: '#666666', italic: false, underline: false, x: 400, y: 330, show: true },
      registrationNo: { fontSize: 12, fontWeight: 'normal', color: '#888888', italic: false, underline: false, x: 400, y: 360, show: true },
      timing: { fontSize: 12, fontWeight: 'normal', color: '#888888', italic: false, underline: false, x: 400, y: 390, show: true }
    }
  },
  
  // Logo Settings
  logoSettings: {
    type: Object,
    default: {
      x: 400, y: 80, width: 80, height: 80, borderRadius: 8,
      borderWidth: 0, borderColor: '#000000', shape: 'circle', show: true
    }
  },
  
  // Design Settings
  design: {
    type: Object,
    default: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#2c7da0',
      fontFamily: 'Poppins',
      fontSize: '12',
      showLogo: true,
      roundedCorners: true,
      shadow: true,
      border: true
    }
  },
  
  // Template Settings
  useTemplate: { type: Boolean, default: false },
  templateImage: { type: String, default: null },
  logo: { type: String, default: null },
  previewImage: { type: String, default: null },
  
  // Language
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  
  // Status
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  
  // Created by (if using authentication)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
}, { timestamps: true });

// Index for better query performance
doctorPrescriptionSchema.index({ doctorName: 1, hospitalName: 1 });
doctorPrescriptionSchema.index({ status: 1 });
doctorPrescriptionSchema.index({ createdAt: -1 });

export default mongoose.model('DoctorPrescription', doctorPrescriptionSchema);