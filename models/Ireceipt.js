import mongoose from 'mongoose';

const ireceiptSchema = new mongoose.Schema({
  // Company Details
  companyName: { type: String, trim: true },
  companyAddress: { type: String, trim: true },
  companyEmail: { type: String, trim: true, lowercase: true },
  companyPhone: { type: String, trim: true },
  
  // Receipt Details
  receiptTitle: { type: String, default: 'PAYMENT RECEIPT' },
  receiptNumber: { type: String, unique: true },
  receiptDate: { type: Date, default: Date.now },
  
  // Payment Details
  amount: { type: Number, min: 0 },
  amountInWords: { type: String, trim: true },
  paymentMode: { 
    type: String, 
    default: 'Cash'
  },
  paymentFor: { type: String, trim: true },
  notes: { type: String, trim: true },
  
  // Styling & Design
  textStyles: { type: Object, default: {} },
  logoSettings: { type: Object, default: {} },
  design: { type: Object, default: {} },
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  
  // Files
  useTemplate: { type: Boolean, default: false },
  templateImage: { type: String, default: null },
  logo: { type: String, default: null },
  previewImage: { type: String, default: null },
  
  // Status
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
}, { timestamps: true });

// Auto-generate receipt number if not provided
ireceiptSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.receiptNumber = `RCP/${year}/${month}/${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Ireceipt', ireceiptSchema);