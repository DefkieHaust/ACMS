import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
}, { timestamps: true });

uploadSchema.index({ apartmentId: 1 });

export default mongoose.model('Upload', uploadSchema);
