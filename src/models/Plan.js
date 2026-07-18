import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  priceType: { type: String, enum: ['per-unit', 'flat'], required: true },
  price: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly'], default: 'monthly' },
  features: [{ type: String }],
});

export default mongoose.model('Plan', planSchema);
