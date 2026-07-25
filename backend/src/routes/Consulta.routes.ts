import { Router } from 'express';
import * as ConsultaController from '../controllers/Consulta.controller';

const router = Router();

router.get('/', ConsultaController.getConsultas);
router.get('/:id', ConsultaController.getConsultaById);
router.post('/', ConsultaController.createConsulta);
router.put('/:id', ConsultaController.updateConsulta);
router.patch('/:id/estado', ConsultaController.cambiarEstadoConsulta);

export default router;