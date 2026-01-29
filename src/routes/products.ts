import { Router } from 'express';
import * as productController from '../controllers/productController';
import * as productSupplierController from '../controllers/productSupplierController';
import { validateBody, validateQuery } from '../middleware/validation';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../schemas/product';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.getAll);
router.get('/:id', productController.getById);
router.post('/', validateBody(createProductSchema), productController.create);
router.put('/:id', validateBody(updateProductSchema), productController.update);
router.delete('/:id', productController.remove);

// Product-Supplier links
router.post('/:id/suppliers', productSupplierController.addSupplier);
router.delete('/:id/suppliers/:supplierId', productSupplierController.removeSupplier);
router.put('/:id/suppliers/:supplierId/primary', productSupplierController.setPrimary);

export default router;
