import mongoose from 'mongoose';

const visitorLogSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  visitorName: { type: String, required: true },
  purpose: { type: String, required: true },
  unitVisited: { type: String, required: true },
  phone: { type: String, default: '' },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date, default: null },
  preApproved: { type: Boolean, default: false },
  qrCode: { type: String, default: '' },
  preApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

visitorLogSchema.index({ qrCode: 1 });
visitorLogSchema.index({ apartmentId: 1, preApproved: 1 });

export default mongoose.model('VisitorLog', visitorLogSchema);
