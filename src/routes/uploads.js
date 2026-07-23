import mongoose from 'mongoose';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';
import { Upload } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const aptDir = path.join(baseUploadsDir, String(req.apartmentId || 'common'));
    if (!fs.existsSync(aptDir)) fs.mkdirSync(aptDir, { recursive: true });
    cb(null, aptDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext);
  },
});

const router = Router();
router.use(authenticate, tenantIsolation);

router.post('/', upload.single('file'), audit('create', 'upload'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const record = await Upload.create({
      apartmentId: req.apartmentId,
      uploadedBy: req.user.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    res.status(201).json({
      success: true,
      data: {
        id: record._id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/api/uploads/${record._id}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const record = await Upload.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!record) return res.status(404).json({ success: false, error: 'Upload not found' });
    const filePath = path.join(baseUploadsDir, String(req.apartmentId), record.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found on disk' });
    res.download(filePath, record.originalName);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to download file' });
  }
});

export default router;
