import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
  category: { type: String, default: 'general' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

documentSchema.index({ apartmentId: 1, category: 1 });

export default mongoose.model('Document', documentSchema);
