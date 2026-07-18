import { Router } from 'express';
import * as ExpedienteController from '../controllers/ExpedienteMedico.controller';

const router = Router();

router.get('/', ExpedienteController.getExpedientes);
router.get('/:id', ExpedienteController.getExpedienteById);
router.post('/', ExpedienteController.createExpediente);
router.put('/:id', ExpedienteController.updateExpediente);
router.delete('/:id', ExpedienteController.deleteExpediente);

export default router;