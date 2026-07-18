import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  unitNumber: { type: String, required: true },
  residentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['occupied', 'vacant'], default: 'vacant' },
});

unitSchema.index({ apartmentId: 1, unitNumber: 1 }, { unique: true });

export default mongoose.model('Unit', unitSchema);
