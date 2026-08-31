import { Router } from 'express';
import * as BoricuasController from '../controllers/Boricuas.controller';

const router = Router();

router.post('/facturas/:id/venta', BoricuasController.crearVentaDesdeFactura);
router.post('/ventas/:idVenta/firmar', BoricuasController.firmarVenta);
router.get('/ventas/:idVenta', BoricuasController.obtenerVenta);

export default router;
