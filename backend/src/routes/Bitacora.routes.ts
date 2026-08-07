import { Router } from 'express';
import * as BitacoraController from '../controllers/Bitacora.controller';

const router = Router();

router.get('/', BitacoraController.getBitacora);

export default router;
