import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { validateBody, validateQuery } from '../middleware/validation';
import { createOrderSchema, updateOrderSchema, receiveOrderSchema, orderQuerySchema } from '../schemas/order';

const router = Router();

router.get('/', validateQuery(orderQuerySchema), orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', validateBody(createOrderSchema), orderController.create);
router.put('/:id', validateBody(updateOrderSchema), orderController.update);
router.post('/:id/receive', validateBody(receiveOrderSchema), orderController.receive);
router.delete('/:id', orderController.remove);

export default router;
