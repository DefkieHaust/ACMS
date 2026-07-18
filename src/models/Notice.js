import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', default: null },
  title: { type: String, required: true },
  body: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notice', noticeSchema);
