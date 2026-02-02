import { Router } from 'express';
import * as assemblyController from '../controllers/assemblyController';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  createAssemblySchema,
  updateAssemblySchema,
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

export default router;
