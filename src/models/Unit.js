import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  unitNumber: { type: String, required: true },
  unitType: { type: String, default: '' },
  residentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['occupied', 'vacant'], default: 'vacant' },
  residentHistory: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    from: { type: Date },
    to: { type: Date, default: null },
  }],
});

unitSchema.index({ apartmentId: 1, unitNumber: 1 }, { unique: true });

export default mongoose.model('Unit', unitSchema);
