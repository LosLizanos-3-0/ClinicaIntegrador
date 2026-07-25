import { Router } from 'express';
import * as DetalleController from '../controllers/DetalleFactura.controller';

const router = Router();

router.get('/', DetalleController.getDetalles);
router.get('/:id', DetalleController.getDetalleById);
router.post('/', DetalleController.createDetalle);
router.put('/:id', DetalleController.updateDetalle);
router.patch('/:id/estado', DetalleController.cambiarEstadoDetalle);

export default router;