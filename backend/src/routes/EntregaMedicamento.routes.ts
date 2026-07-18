import { Router } from 'express';
import * as EntregaController from '../controllers/EntregaMedicamento.controller';

const router = Router();

router.get('/', EntregaController.getEntregas);
router.get('/:id', EntregaController.getEntregaById);
router.post('/', EntregaController.createEntrega);
router.put('/:id', EntregaController.updateEntrega);
router.delete('/:id', EntregaController.deleteEntrega);

export default router;