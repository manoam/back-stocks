import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Configure multer to store in memory (for base64 conversion)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP'));
    }
  },
});

// POST /api/upload/image - Upload a product image (stores in database)
router.post('/image', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier uploadé' });
    }

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Return the data - the frontend will send it with the product update
    res.json({
      success: true,
      data: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType,
        imageData: base64Data,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/upload/image/:productId - Serve image from database
router.get('/image/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageData: true, imageMimeType: true },
    });

    if (!product || !product.imageData) {
      return res.status(404).json({ success: false, error: 'Image non trouvée' });
    }

    // Convert base64 back to buffer
    const imageBuffer = Buffer.from(product.imageData, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', product.imageMimeType || 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/upload/image/:productId - Clear image from product
router.delete('/image/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;

    await prisma.product.update({
      where: { id: productId },
      data: {
        imageData: null,
        imageMimeType: null,
        imageUrl: null,
      },
    });

    res.json({ success: true, message: 'Image supprimée' });
  } catch (error) {
    next(error);
  }
});

export default router;
