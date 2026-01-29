import { Router } from 'express';
import * as siteController from '../controllers/siteController';
import { validateBody } from '../middleware/validation';
import { createSiteSchema, updateSiteSchema } from '../schemas/site';

const router = Router();

router.get('/', siteController.getAll);
router.get('/:id', siteController.getById);
router.post('/', validateBody(createSiteSchema), siteController.create);
router.put('/:id', validateBody(updateSiteSchema), siteController.update);
router.delete('/:id', siteController.remove);

export default router;
