import mongoose from 'mongoose';

const customRoleSchema = new mongoose.Schema({
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', required: true },
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

customRoleSchema.index({ committeeId: 1, name: 1 }, { unique: true });

export default mongoose.model('CustomRole', customRoleSchema);
