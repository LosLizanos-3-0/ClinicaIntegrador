import { Router } from 'express';
import * as UsuarioController from '../controllers/Usuario.controller';

const router = Router();

router.get('/', UsuarioController.getUsuarios);
router.get('/:id', UsuarioController.getUsuarioById);
router.post('/', UsuarioController.createUsuario);
router.put('/:id', UsuarioController.updateUsuario);
router.patch('/:id/estado', UsuarioController.cambiarEstadoUsuario);

export default router;