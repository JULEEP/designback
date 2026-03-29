import mongoose from 'mongoose';

const billBookSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  companyAddress: { type: String, trim: true },
  companyEmail: { type: String, trim: true, lowercase: true },
  companyPhone: { type: String, trim: true },
  customerName: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  customerEmail: { type: String, trim: true, lowercase: true },
  customerPhone: { type: String, trim: true },
  textStyles: { type: Object, default: {} },
  logoSettings: { type: Object, default: {} },
  design: { type: Object, default: {} },
  useTemplate: { type: Boolean, default: false },
  templateImage: { type: String, default: null },
  logo: { type: String, default: null },
  previewImage: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('BillBook', billBookSchema);