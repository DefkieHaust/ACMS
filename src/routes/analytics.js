import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { Apartment, SaaSInvoice, Unit, Complaint, ServiceRequest, FacilityBooking, VisitorLog, CommitteeLedger, MaintenanceBill } from '../models/index.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/overview', async (req, res) => {
  try {
    const isSiteAdmin = req.user.type === 'site_admin';
    const match = isSiteAdmin ? {} : { apartmentId: new mongoose.Types.ObjectId(req.apartmentId) };
    const aptMatch = isSiteAdmin ? {} : { _id: new mongoose.Types.ObjectId(req.apartmentId) };

    const [apartmentCounts, revenueData, unitStats, complaintStats, serviceStats, bookingStats, visitorStats, ledgerStats, billStats] = await Promise.all([
      Apartment.aggregate([
        { $match: aptMatch },
        { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } } } },
      ]),
      SaaSInvoice.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } }, unpaid: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, '$amount', 0] } } } },
      ]),
      Unit.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } }, vacant: { $sum: { $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0] } } } },
      ]),
      Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ServiceRequest.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      FacilityBooking.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      VisitorLog.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: 1 }, checkedIn: { $sum: { $cond: [{ $ne: ['$checkOut', null] }, 1, 0] } }, preApproved: { $sum: { $cond: [{ $eq: ['$preApproved', true] }, 1, 0] } } } },
      ]),
      CommitteeLedger.aggregate([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      MaintenanceBill.aggregate([
        { $match: match },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        apartments: apartmentCounts[0] || { total: 0, active: 0, suspended: 0 },
        revenue: revenueData[0] || { total: 0, paid: 0, unpaid: 0 },
        units: unitStats[0] || { total: 0, occupied: 0, vacant: 0 },
        complaints: Object.fromEntries(complaintStats.map(c => [c._id, c.count])),
        serviceRequests: Object.fromEntries(serviceStats.map(s => [s._id, s.count])),
        bookings: Object.fromEntries(bookingStats.map(b => [b._id, b.count])),
        visitors: visitorStats[0] || { total: 0, checkedIn: 0, preApproved: 0 },
        ledger: Object.fromEntries(ledgerStats.map(l => [l._id, l.total])),
        bills: Object.fromEntries(billStats.map(b => [b._id, { total: b.total, count: b.count }])),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

router.get('/revenue-trend', async (req, res) => {
  try {
    const isSiteAdmin = req.user.type === 'site_admin';
    const match = isSiteAdmin ? {} : { apartmentId: new mongoose.Types.ObjectId(req.apartmentId) };
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const trend = await SaaSInvoice.aggregate([
      { $match: { ...match, generatedAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$generatedAt' } }, total: { $sum: '$amount' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: trend });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue trend' });
  }
});

export default router;
