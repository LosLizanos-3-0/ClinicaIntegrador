import { Router } from 'express';
import * as MedicamentoController from '../controllers/Medicamento.controller';

const router = Router();

router.get('/', MedicamentoController.getMedicamentos);
router.get('/:id', MedicamentoController.getMedicamentoById);
router.post('/', MedicamentoController.createMedicamento);
router.put('/:id', MedicamentoController.updateMedicamento);
router.patch('/:id/estado', MedicamentoController.cambiarEstadoMedicamento);

export default router;