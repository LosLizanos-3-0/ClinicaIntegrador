import { Router } from 'express';
import * as PacienteController from '../controllers/Paciente.controller';

const router = Router();

router.get('/', PacienteController.getPacientes);
router.get('/:id', PacienteController.getPacienteById);
router.post('/', PacienteController.createPaciente);
router.put('/:id', PacienteController.updatePaciente);
router.delete('/:id', PacienteController.deletePaciente);

export default router;