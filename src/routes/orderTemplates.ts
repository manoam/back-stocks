import { Router } from 'express';
import * as orderTemplateController from '../controllers/orderTemplateController';
import { validateBody } from '../middleware/validation';
import { createOrderTemplateSchema, updateOrderTemplateSchema } from '../schemas/orderTemplate';

const router = Router();

router.get('/', orderTemplateController.getAll);
router.get('/:id', orderTemplateController.getById);
router.post('/', validateBody(createOrderTemplateSchema), orderTemplateController.create);
router.put('/:id', validateBody(updateOrderTemplateSchema), orderTemplateController.update);
router.delete('/:id', orderTemplateController.remove);

export default router;
