import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/recent-movements', dashboardController.getRecentMovements);
router.get('/pending-orders', dashboardController.getPendingOrders);
router.get('/low-stock-alerts', dashboardController.getLowStockAlerts);
router.get('/movements-by-day', dashboardController.getMovementsByDay);
router.get('/stock-by-site', dashboardController.getStockBySite);
router.get('/top-products', dashboardController.getTopProductsByStock);
router.get('/orders-by-month', dashboardController.getOrdersByMonth);

export default router;
