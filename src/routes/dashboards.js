import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import {
  Apartment, Plan, User, Unit, Committee,
  CommitteeLedger, MaintenanceBill, SaaSInvoice,
  Complaint, VisitorLog, Notice,
} from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/site-admin', authorize(ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const [totalApartments, activeApartments, totalPlans, totalInvoices, unpaidInvoices] = await Promise.all([
      Apartment.countDocuments(),
      Apartment.countDocuments({ status: 'active' }),
      Plan.countDocuments(),
      SaaSInvoice.countDocuments(),
      SaaSInvoice.countDocuments({ status: 'unpaid' }),
    ]);
    const invoiceAgg = await SaaSInvoice.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, unpaidAmount: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, '$amount', 0] } } } },
    ]);
    const totalRevenue = invoiceAgg[0]?.totalAmount || 0;
    const outstandingRevenue = invoiceAgg[0]?.unpaidAmount || 0;

    const recentApartments = await Apartment.find().populate('planId', 'name').sort({ createdAt: -1 }).limit(5);
    const recentInvoices = await SaaSInvoice.find()
      .populate('apartmentId', 'name')
      .populate('planId', 'name')
      .sort({ generatedAt: -1 }).limit(5);

    res.json({ success: true, data: {
      totalApartments, activeApartments, totalPlans,
      totalInvoices, unpaidInvoices, totalRevenue, outstandingRevenue,
      recentApartments, recentInvoices,
    } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Dashboard error' });
  }
});

router.get('/apartment-admin', authorize(ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    const aptId = req.apartmentId;
    const [totalUnits, occupiedUnits, totalResidents, totalCommittees, totalComplaints, openComplaints] = await Promise.all([
      Unit.countDocuments({ apartmentId: aptId }),
      Unit.countDocuments({ apartmentId: aptId, status: 'occupied' }),
      User.countDocuments({ apartmentId: aptId, type: ROLES.RESIDENT }),
      Committee.countDocuments({ apartmentId: aptId }),
      Complaint.countDocuments({ apartmentId: aptId }),
      Complaint.countDocuments({ apartmentId: aptId, status: { $ne: 'resolved' } }),
    ]);

    const billAgg = await MaintenanceBill.aggregate([
      { $match: { apartmentId: aptId } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalBills = billAgg.reduce((s, b) => s + b.total, 0);
    const paidBills = billAgg.find((b) => b._id === 'paid')?.total || 0;
    const unpaidBills = billAgg.find((b) => b._id === 'unpaid')?.total || 0;

    const apartment = await Apartment.findById(aptId).populate('planId', 'name');
    const invoices = await SaaSInvoice.find({ apartmentId: aptId }).populate('planId', 'name').sort({ generatedAt: -1 }).limit(5);
    const recentComplaints = await Complaint.find({ apartmentId: aptId })
      .populate('raisedByUnitId', 'unitNumber')
      .populate('committeeId', 'name')
      .sort({ createdAt: -1 }).limit(5);
    const committees = await Committee.find({ apartmentId: aptId }).populate('headUserId', 'name');

    res.json({ success: true, data: {
      totalUnits, occupiedUnits, vacancyRate: totalUnits ? Math.round((1 - occupiedUnits / totalUnits) * 100) : 0,
      totalResidents, totalCommittees, totalComplaints, openComplaints,
      totalBills, paidBills, unpaidBills, apartment, invoices, recentComplaints, committees,
    } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Dashboard error' });
  }
});

router.get('/committee-head', authorize(ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER), async (req, res) => {
  try {
    const commId = req.user.committeeId;
    const aptId = req.apartmentId;
    const [committee, members] = await Promise.all([
      Committee.findById(commId),
      User.countDocuments({ committeeId: commId, type: ROLES.COMMITTEE_MEMBER }),
    ]);

    const ledgerAgg = await CommitteeLedger.aggregate([
      { $match: { committeeId: commId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const totalIncome = ledgerAgg.find((l) => l._id === 'income')?.total || 0;
    const totalExpense = ledgerAgg.find((l) => l._id === 'expense')?.total || 0;
    const recentLedger = await CommitteeLedger.find({ committeeId: commId })
      .populate('recordedBy', 'name').sort({ date: -1 }).limit(5);
    const [totalComplaints, openComplaints] = await Promise.all([
      Complaint.countDocuments({ committeeId: commId }),
      Complaint.countDocuments({ committeeId: commId, status: { $ne: 'resolved' } }),
    ]);
    const recentComplaints = await Complaint.find({ committeeId: commId })
      .populate('raisedByUnitId', 'unitNumber').sort({ createdAt: -1 }).limit(5);
    const billsAgg = await MaintenanceBill.aggregate([
      { $match: { committeeId: commId } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalBills = billsAgg.reduce((s, b) => s + b.total, 0);
    const unpaidBills = billsAgg.find((b) => b._id === 'unpaid')?.total || 0;

    res.json({ success: true, data: {
      committee, members, totalIncome, totalExpense, balance: totalIncome - totalExpense,
      recentLedger, totalComplaints, openComplaints, recentComplaints, totalBills, unpaidBills,
    } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Dashboard error' });
  }
});

router.get('/resident', authorize(ROLES.RESIDENT), async (req, res) => {
  try {
    const unit = await Unit.findOne({ residentUserId: req.user.userId });
    if (!unit) return res.json({ success: true, data: { unit: null } });

    const [bills, complaints, notices] = await Promise.all([
      MaintenanceBill.find({ unitId: unit._id }).populate('committeeId', 'name').sort({ dueDate: -1 }),
      Complaint.find({ raisedByUnitId: unit._id }).populate('committeeId', 'name').sort({ createdAt: -1 }),
      Notice.find({ apartmentId: req.apartmentId }).populate('postedBy', 'name').sort({ createdAt: -1 }).limit(10),
    ]);

    const totalBills = bills.reduce((s, b) => s + b.amount, 0);
    const unpaidBills = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0);

    res.json({ success: true, data: {
      unit, bills, complaints, notices,
      totalBills, unpaidBills,
      billsCount: bills.length, unpaidCount: bills.filter((b) => b.status === 'unpaid').length,
    } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Dashboard error' });
  }
});

export default router;
