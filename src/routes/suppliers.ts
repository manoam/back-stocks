import { Router } from 'express';
import * as supplierController from '../controllers/supplierController';
import { validateBody, validateQuery } from '../middleware/validation';
import { createSupplierSchema, updateSupplierSchema, supplierQuerySchema } from '../schemas/supplier';

const router = Router();

router.get('/', validateQuery(supplierQuerySchema), supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', validateBody(createSupplierSchema), supplierController.create);
router.put('/:id', validateBody(updateSupplierSchema), supplierController.update);
router.delete('/:id', supplierController.remove);

export default router;
