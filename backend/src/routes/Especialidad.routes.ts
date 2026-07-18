import { Router } from 'express';
import * as EspecialidadController from '../controllers/Especialidad.controller';

const router = Router();

router.get('/', EspecialidadController.getEspecialidades);
router.get('/:id', EspecialidadController.getEspecialidadById);
router.post('/', EspecialidadController.createEspecialidad);
router.put('/:id', EspecialidadController.updateEspecialidad);
router.delete('/:id', EspecialidadController.deleteEspecialidad);

export default router;