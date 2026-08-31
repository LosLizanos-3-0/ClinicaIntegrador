import { Router } from 'express';
import * as TributacionController from '../controllers/Tributacion.controller';

const router = Router();

router.post('/facturas', TributacionController.enviarFactura);
router.post('/facturas/:idExterno/revalidar', TributacionController.revalidarFactura);

export default router;