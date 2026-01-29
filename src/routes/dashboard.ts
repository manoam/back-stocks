import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/recent-movements', dashboardController.getRecentMovements);
router.get('/pending-orders', dashboardController.getPendingOrders);

export default router;
