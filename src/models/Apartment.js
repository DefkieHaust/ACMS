import mongoose from 'mongoose';

const apartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Apartment', apartmentSchema);
