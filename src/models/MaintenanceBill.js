import mongoose from 'mongoose';

const maintenanceBillSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  amount: { type: Number, required: true },
  period: { type: String, required: true },
  status: { type: String, enum: ['paid', 'unpaid', 'overdue'], default: 'unpaid' },
  dueDate: { type: Date, required: true },
});

export default mongoose.model('MaintenanceBill', maintenanceBillSchema);
