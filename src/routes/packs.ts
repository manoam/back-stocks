import { Router } from 'express';
import * as packController from '../controllers/packController';
import { validateBody } from '../middleware/validation';
import { createPackSchema, updatePackSchema } from '../schemas/pack';

const router = Router();

router.get('/', packController.getAll);
router.get('/:id', packController.getById);
router.post('/', validateBody(createPackSchema), packController.create);
router.put('/:id', validateBody(updatePackSchema), packController.update);
router.delete('/:id', packController.remove);

export default router;
