import mongoose from 'mongoose';

const visitorLogSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  visitorName: { type: String, required: true },
  purpose: { type: String, required: true },
  unitVisited: { type: String, required: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date, default: null },
});

export default mongoose.model('VisitorLog', visitorLogSchema);
