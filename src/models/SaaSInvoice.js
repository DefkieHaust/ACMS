import mongoose from 'mongoose';

const saasInvoiceSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  period: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  generatedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
});

export default mongoose.model('SaaSInvoice', saasInvoiceSchema);
