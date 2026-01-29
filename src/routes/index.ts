import { Router } from 'express';
import productRoutes from './products';
import supplierRoutes from './suppliers';
import siteRoutes from './sites';
import stockRoutes from './stocks';
import movementRoutes from './movements';
import orderRoutes from './orders';
import dashboardRoutes from './dashboard';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sites', siteRoutes);
router.use('/stocks', stockRoutes);
router.use('/movements', movementRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
