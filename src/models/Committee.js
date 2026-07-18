import mongoose from 'mongoose';

const committeeSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  name: { type: String, required: true },
  headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

committeeSchema.index({ apartmentId: 1, name: 1 }, { unique: true });

export default mongoose.model('Committee', committeeSchema);
