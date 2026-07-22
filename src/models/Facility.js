import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  capacity: { type: Number, required: true },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

facilitySchema.index({ apartmentId: 1 });

export default mongoose.model('Facility', facilitySchema);
