import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  residentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'other' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

serviceRequestSchema.index({ apartmentId: 1, status: 1, createdAt: -1 });

export default mongoose.model('ServiceRequest', serviceRequestSchema);
