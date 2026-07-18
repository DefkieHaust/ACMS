import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', required: true },
  raisedByUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  rating: { type: Number, min: 1, max: 5, default: null },
});

export default mongoose.model('Complaint', complaintSchema);
