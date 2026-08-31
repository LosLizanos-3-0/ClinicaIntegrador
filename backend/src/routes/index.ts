import { Router } from 'express';

import rolRoutes from './Rol.routes';
import usuarioRoutes from './Usuario.routes';
import especialidadRoutes from './Especialidad.routes';
import usuarioEspecialidadRoutes from './UsuarioEspecialidad.routes';
import pacienteRoutes from './Paciente.routes';
import citaRoutes from './Cita.routes';
import expedienteRoutes from './ExpedienteMedico.routes';
import consultaRoutes from './Consulta.routes';
import medicamentoRoutes from './Medicamento.routes';
import categoriaMedicamentoRoutes from './CategoriaMedicamento.routes';
import bitacoraRoutes from './Bitacora.routes';
import recetaRoutes from './Receta.routes';
import detalleRecetaRoutes from './DetalleReceta.routes';
import entregaRoutes from './EntregaMedicamento.routes';
import facturaRoutes from './Factura.routes';
import detalleFacturaRoutes from './DetalleFactura.routes';
import pagoRoutes from './Pago.routes';
import authRoutes from './Auth.routes';
import reporteRoutes from './Reporte.routes';
import tributacionRoutes from './Tributacion.routes';
import boricuasRoutes from './Boricuas.routes';

const router = Router();

router.use('/roles', rolRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/especialidades', especialidadRoutes);
router.use('/usuario-especialidad', usuarioEspecialidadRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/citas', citaRoutes);
router.use('/expedientes', expedienteRoutes);
router.use('/consultas', consultaRoutes);
router.use('/medicamentos', medicamentoRoutes);
router.use('/categorias-medicamento', categoriaMedicamentoRoutes);
router.use('/bitacora', bitacoraRoutes);
router.use('/recetas', recetaRoutes);
router.use('/detalle-receta', detalleRecetaRoutes);
router.use('/entregas', entregaRoutes);
router.use('/facturas', facturaRoutes);
router.use('/detalle-factura', detalleFacturaRoutes);
router.use('/pagos', pagoRoutes);
router.use('/auth', authRoutes);
router.use('/reportes', reporteRoutes);
router.use('/tributacion', tributacionRoutes);
router.use('/facturacion-digital', boricuasRoutes);

export default router;