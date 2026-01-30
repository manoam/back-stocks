import { Router } from 'express';
import * as exportController from '../controllers/exportController';

const router = Router();

// Export products (synthese)
router.get('/products', exportController.exportProducts);

// Export stock matrix
router.get('/stock-matrix', exportController.exportStockMatrix);

// Export movements
router.get('/movements', exportController.exportMovements);

// Export orders
router.get('/orders', exportController.exportOrders);

// Export all (full database backup)
router.get('/all', exportController.exportAll);

export default router;
