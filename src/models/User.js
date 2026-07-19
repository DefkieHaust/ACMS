import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', default: null },
  type: {
    type: String,
    enum: ['site_admin', 'apartment_admin', 'committee_head', 'committee_member', 'resident', 'unit_owner'],
    required: true,
  },
  residentType: {
    type: String,
    enum: ['tenant', 'owner_family', 'owner', null],
    default: null,
  },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', default: null },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
  name: { type: String, required: true },
  identifier: { type: String, required: true },
  passwordHash: { type: String, required: true },
  phone: [{ type: String }],
  identityNumber: { type: String, default: '' },
  residence: { type: String, default: '' },
  customRole: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

userSchema.index({ apartmentId: 1, type: 1, identifier: 1 }, { unique: true, sparse: true });

export default mongoose.model('User', userSchema);
