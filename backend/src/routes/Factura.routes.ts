import { Router } from 'express';
import * as FacturaController from '../controllers/Factura.controller';

const router = Router();

router.get('/', FacturaController.getFacturas);
router.get('/:id', FacturaController.getFacturaById);
router.post('/', FacturaController.createFactura);
router.put('/:id', FacturaController.updateFactura);
router.delete('/:id', FacturaController.deleteFactura);

export default router;