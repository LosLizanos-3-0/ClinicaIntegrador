import { Router } from 'express';
import * as CitaController from '../controllers/Cita.controller';

const router = Router();

router.get('/', CitaController.getCitas);
router.get('/:id', CitaController.getCitaById);
router.post('/', CitaController.createCita);
router.put('/:id', CitaController.updateCita);
router.patch('/:id/estado', CitaController.cambiarEstadoCita);

export default router;