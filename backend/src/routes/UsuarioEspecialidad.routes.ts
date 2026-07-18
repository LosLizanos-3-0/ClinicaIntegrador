import { Router } from 'express';
import * as UEController from '../controllers/UsuarioEspecialidad.controller';

const router = Router();

router.get('/', UEController.getUsuarioEspecialidades);
router.get('/usuario/:idUsuario', UEController.getByUsuario);
router.post('/', UEController.createUsuarioEspecialidad);
router.delete('/:idUsuario/:idEspecialidad', UEController.deleteUsuarioEspecialidad);

export default router;