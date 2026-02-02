import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP'));
    }
  },
});

// POST /api/upload/image - Upload a product image
router.post('/image', upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier uploadé' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/upload/image/:filename - Delete an uploaded image
router.delete('/image/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.params.filename as string;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image supprimée' });
    } else {
      res.status(404).json({ success: false, error: 'Image non trouvée' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
