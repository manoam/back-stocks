import { Router } from 'express';
import * as assemblyController from '../controllers/assemblyController';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  createAssemblySchema,
  updateAssemblySchema,
  addProductSchema,
  updateProductQuantitySchema,
  querySchema,
} from '../schemas/assemblySchemas';

const router = Router();

// GET /api/assemblies - List all assemblies
router.get('/', validateQuery(querySchema), assemblyController.getAll);

// GET /api/assemblies/:id - Get assembly by ID
router.get('/:id', assemblyController.getById);

// POST /api/assemblies - Create new assembly
router.post('/', validateBody(createAssemblySchema), assemblyController.create);

// PUT /api/assemblies/:id - Update assembly
router.put('/:id', validateBody(updateAssemblySchema), assemblyController.update);

// DELETE /api/assemblies/:id - Delete assembly
router.delete('/:id', assemblyController.remove);

// POST /api/assemblies/:id/products - Add product to assembly
router.post('/:id/products', validateBody(addProductSchema), assemblyController.addProduct);

// DELETE /api/assemblies/:id/products/:productId - Remove product from assembly
router.delete('/:id/products/:productId', assemblyController.removeProduct);

// PUT /api/assemblies/:id/products/:productId - Update product quantity in assembly
router.put('/:id/products/:productId', validateBody(updateProductQuantitySchema), assemblyController.updateProductQuantity);

export default router;
