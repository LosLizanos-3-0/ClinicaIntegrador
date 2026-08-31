import { Request, Response } from 'express';
import axios from 'axios';

const TRIBUTACION_API_BASE_URL =
  process.env.TRIBUTACION_API_BASE_URL || 'https://mini-tributacion-backend.onrender.com';

// Actúa como intermediario: reenvía la petición del frontend al backend
// real de Mini Tributación Directa (servidor-a-servidor, sin problema de
// CORS), y devuelve tal cual la respuesta (incluyendo códigos de error
// como 400/403/404/409, que también traen información útil).
export const enviarFactura = async (req: Request, res: Response) => {
  try {
    const respuesta = await axios.post(`${TRIBUTACION_API_BASE_URL}/api/facturas`, req.body, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      validateStatus: () => true,
    });
    res.status(respuesta.status).json(respuesta.data);
  } catch (error) {
    console.error('Error al conectar con Tributación Directa:', error);
    res.status(502).json({ mensaje: 'No fue posible comunicarse con Tributación Directa.' });
  }
};

export const revalidarFactura = async (req: Request, res: Response) => {
  try {
    const respuesta = await axios.post(
      `${TRIBUTACION_API_BASE_URL}/api/facturas/${req.params.idExterno}/revalidar`,
      {},
      { validateStatus: () => true }
    );
    res.status(respuesta.status).json(respuesta.data);
  } catch (error) {
    console.error('Error al conectar con Tributación Directa:', error);
    res.status(502).json({ mensaje: 'No fue posible comunicarse con Tributación Directa.' });
  }
};