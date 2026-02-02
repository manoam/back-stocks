import { Router } from 'express';
import productRoutes from './products';
import supplierRoutes from './suppliers';
import siteRoutes from './sites';
import stockRoutes from './stocks';
import movementRoutes from './movements';
import orderRoutes from './orders';
import dashboardRoutes from './dashboard';
import importRoutes from './import';
import exportRoutes from './export';
import assemblyRoutes from './assemblyRoutes';
import assemblyTypeRoutes from './assemblyTypeRoutes';
import uploadRoutes from './upload';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sites', siteRoutes);
router.use('/stocks', stockRoutes);
router.use('/movements', movementRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/import', importRoutes);
router.use('/export', exportRoutes);
router.use('/assemblies', assemblyRoutes);
router.use('/assembly-types', assemblyTypeRoutes);
router.use('/upload', uploadRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
