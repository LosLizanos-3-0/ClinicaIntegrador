import { Router } from 'express';
import * as PacienteController from '../controllers/Paciente.controller';

const router = Router();

router.get('/', PacienteController.getPacientes);
router.get('/buscar/:nombre', PacienteController.buscarPaciente); // debe ir antes de /:id
router.get('/:id', PacienteController.getPacienteById);
router.post('/', PacienteController.createPaciente);
router.put('/:id', PacienteController.updatePaciente);
router.patch('/:id/estado', PacienteController.cambiarEstadoPaciente);

export default router;