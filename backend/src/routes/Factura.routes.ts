import { Router } from 'express';
import * as FacturaController from '../controllers/Factura.controller';
import * as ComprobanteController from '../controllers/Comprobante.controller';

const router = Router();

router.get('/', FacturaController.getFacturas);
router.get('/:id', FacturaController.getFacturaById);
router.post('/', FacturaController.createFactura);
router.put('/:id', FacturaController.updateFactura);
router.patch('/:id/monto-consulta', FacturaController.updateMontoConsultaFactura);
router.patch('/:id/estado', FacturaController.cambiarEstadoFactura);

// Comprobante electrónico "bonito" (Billing Kilometer, adaptador "reserva").
// Van antes de cualquier ruta genérica /:algo para no chocar con /:id.
router.post('/comprobante/:documentoId/anular', ComprobanteController.anularComprobanteFactura);
router.get('/comprobante/:documentoId/pdf', ComprobanteController.descargarComprobanteFactura);
router.post('/:id/comprobante/preview', ComprobanteController.previsualizarComprobanteFactura);
router.post('/:id/comprobante', ComprobanteController.emitirComprobanteFactura);

export default router;