import { Router } from 'express';
import * as ReporteController from '../controllers/Reporte.controller';

const router = Router();

router.get('/dashboard', ReporteController.getDashboard);
router.get('/citas/rango', ReporteController.getCitasRango);
router.get('/citas/especialidad', ReporteController.getCitasEspecialidad);
router.get('/inventario/categoria', ReporteController.getMedicamentosCategoria);
router.get('/facturacion/ingresos', ReporteController.getIngresosRango);
router.get('/facturacion/especialidad', ReporteController.getFacturacionEspecialidad);
router.get('/pacientes/nuevos', ReporteController.getPacientesNuevos);

export default router;