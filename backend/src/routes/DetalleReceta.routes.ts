import { Router } from 'express';
import * as DetalleController from '../controllers/DetalleReceta.controller';

const router = Router();

router.get('/', DetalleController.getDetalles);
router.get('/:id', DetalleController.getDetalleById);
router.post('/', DetalleController.createDetalle);
router.put('/:id', DetalleController.updateDetalle);
router.patch('/:id/estado', DetalleController.cambiarEstadoDetalle);
router.patch('/:id/incluir-factura', DetalleController.marcarIncluirFactura);

export default router;