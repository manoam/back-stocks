import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.get('/known', userController.getKnownUsers as any);

export default router;
