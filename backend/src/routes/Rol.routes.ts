import { Router } from 'express';
import * as RolController from '../controllers/Rol.controller';

const router = Router();

router.get('/', RolController.getRoles);
router.get('/:id', RolController.getRolById);
router.post('/', RolController.createRol);
router.put('/:id', RolController.updateRol);
router.delete('/:id', RolController.deleteRol);

export default router;