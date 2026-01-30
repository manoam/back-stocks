import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/importController';

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez .xlsx, .xls ou .csv'));
    }
  },
});

// Preview import (without saving)
router.post('/preview', upload.single('file'), importController.previewImport);

// Full import
router.post('/', upload.single('file'), importController.importExcel);

// Download template
router.get('/template', importController.getExportTemplate);

export default router;
