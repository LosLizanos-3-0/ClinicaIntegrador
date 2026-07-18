import { Router } from 'express';
import * as PagoController from '../controllers/Pago.controller';

const router = Router();

router.get('/', PagoController.getPagos);
router.get('/:id', PagoController.getPagoById);
router.post('/', PagoController.createPago);
router.put('/:id', PagoController.updatePago);
router.delete('/:id', PagoController.deletePago);

export default router;