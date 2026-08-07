import { Router } from 'express';
import * as CategoriaMedicamentoController from '../controllers/CategoriaMedicamento.controller';

const router = Router();

router.get('/', CategoriaMedicamentoController.getCategoriasMedicamento);
router.get('/:id', CategoriaMedicamentoController.getCategoriaMedicamentoById);
router.post('/', CategoriaMedicamentoController.createCategoriaMedicamento);
router.put('/:id', CategoriaMedicamentoController.updateCategoriaMedicamento);
router.patch('/:id/estado', CategoriaMedicamentoController.cambiarEstadoCategoriaMedicamento);

export default router;
