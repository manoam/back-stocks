import { Router } from 'express';
import * as movementController from '../controllers/movementController';
import { validateBody, validateQuery } from '../middleware/validation';
import { createMovementSchema, movementQuerySchema } from '../schemas/movement';

const router = Router();

router.get('/', validateQuery(movementQuerySchema), movementController.getAll);
router.get('/:id', movementController.getById);
router.post('/', validateBody(createMovementSchema), movementController.create);

export default router;
