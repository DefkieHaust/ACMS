import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { User, Unit, Committee, CommitteeLedger, MaintenanceBill, Complaint } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

function toCSV(headers, rows) {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

router.get('/residents', authorize(ROLES.APARTMENT_ADMIN, ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const filter = req.user.type === ROLES.SITE_ADMIN ? {} : { apartmentId: req.apartmentId };
    filter.type = ROLES.RESIDENT;
    const residents = await User.find(filter).populate('unitId', 'unitNumber').lean();

    const rows = residents.map(r => ({
      name: r.name, identifier: r.identifier,
      unitNumber: r.unitId?.unitNumber || '',
      phone: (r.phone || []).join('; '),
      identityNumber: r.identityNumber,
      residence: r.residence,
      status: r.status,
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=residents.csv');
    res.send(toCSV(['name', 'identifier', 'unitNumber', 'phone', 'identityNumber', 'residence', 'status'], rows));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

router.get('/units', authorize(ROLES.APARTMENT_ADMIN, ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const filter = req.user.type === ROLES.SITE_ADMIN ? {} : { apartmentId: req.apartmentId };
    const units = await Unit.find(filter).populate('residentUserId', 'name identifier').populate('ownerId', 'name identifier').lean();

    const rows = units.map(u => ({
      unitNumber: u.unitNumber, unitType: u.unitType,
      status: u.status,
      residentName: u.residentUserId?.name || '',
      ownerName: u.ownerId?.name || '',
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=units.csv');
    res.send(toCSV(['unitNumber', 'unitType', 'status', 'residentName', 'ownerName'], rows));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

router.get('/complaints', authorize(ROLES.APARTMENT_ADMIN, ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const filter = req.user.type === ROLES.SITE_ADMIN ? {} : { apartmentId: req.apartmentId };
    const complaints = await Complaint.find(filter)
      .populate('raisedByUnitId', 'unitNumber')
      .populate('committeeId', 'name')
      .lean();

    const rows = complaints.map(c => ({
      description: c.description, status: c.status,
      unit: c.raisedByUnitId?.unitNumber || '',
      committee: c.committeeId?.name || '',
      rating: c.rating ?? '',
      createdAt: c.createdAt?.toISOString() || '',
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
    res.send(toCSV(['description', 'status', 'unit', 'committee', 'rating', 'createdAt'], rows));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

export default router;
