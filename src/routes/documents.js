import mongoose from 'mongoose';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticate, tenantIsolation, authorize } from '../middleware/auth.js';
import { getPagination } from '../utils/helpers.js';
import { Document } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext);
  },
});

const router = Router();
router.use(authenticate, tenantIsolation);

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const { category, description } = req.body;
    const doc = await Document.create({
      apartmentId: req.apartmentId,
      uploadedBy: req.user.userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: category || 'general',
      description: description || '',
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = { apartmentId: req.apartmentId };
    if (req.query.category) filter.category = req.query.category;
    const { page, limit, skip } = getPagination(req.query);
    const [documents, total] = await Promise.all([
      Document.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Document.countDocuments(filter)
    ]);
    res.json({ success: true, data: documents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const doc = await Document.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    const filePath = path.join(uploadsDir, doc.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found on disk' });
    res.download(filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to download document' });
  }
});

router.delete('/:id', authorize(ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const doc = await Document.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    const filePath = path.join(uploadsDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

export default router;
