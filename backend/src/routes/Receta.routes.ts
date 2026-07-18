import { Router } from 'express';
import * as RecetaController from '../controllers/Receta.controller';

const router = Router();

router.get('/', RecetaController.getRecetas);
router.get('/:id', RecetaController.getRecetaById);
router.post('/', RecetaController.createReceta);
router.put('/:id', RecetaController.updateReceta);
router.delete('/:id', RecetaController.deleteReceta);

export default router;