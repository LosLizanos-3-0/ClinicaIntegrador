import { Router } from 'express';
import * as RecetaController from '../controllers/Receta.controller';

const router = Router();

router.get('/', RecetaController.getRecetas);
router.get('/:id', RecetaController.getRecetaById);
router.post('/', RecetaController.createReceta);
router.put('/:id', RecetaController.updateReceta);
router.patch('/:id/estado', RecetaController.cambiarEstadoReceta);

export default router;