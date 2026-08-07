import { Request, Response } from 'express';
import * as BitacoraModel from '../models/Bitacora.model';

export const getBitacora = async (req: Request, res: Response) => {
  try {
    const tabla = typeof req.query.tabla === 'string' && req.query.tabla.trim() !== '' ? req.query.tabla.trim() : undefined;
    res.json(await BitacoraModel.selectBitacora(tabla));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la bitácora' });
  }
};