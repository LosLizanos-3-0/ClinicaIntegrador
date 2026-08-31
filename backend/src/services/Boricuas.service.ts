import axios from 'axios';

const BORICUAS_API_URL =
  process.env.BORICUAS_API_URL || 'https://backend-proyecto-web-ii.onrender.com/api/facturacion';
const BORICUAS_API_KEY = process.env.BORICUAS_API_KEY || '';

export interface VentaBoricuas {
  id: number;
  estado: string;
  xmlOriginal?: string;
  mensaje?: string;
  numeroAcuse?: string;
  motivo?: string | null;
}

export interface DatosVentaBoricuas {
  referenciaExterna: string;
  clienteNombre: string;
  clienteIdentificacion: string;
  clienteCorreo?: string;
  detalle: string;
  monto: number;
}

export interface DatosFirmaBoricuas {
  xmlFirmado: string;
  hashDocumento?: string;
  serialCertificado?: string;
}

function requerirApiKey() {
  if (!BORICUAS_API_KEY) {
    throw new Error('Falta configurar BORICUAS_API_KEY en el .env del backend.');
  }
}

export async function crearVenta(datos: DatosVentaBoricuas): Promise<VentaBoricuas> {
  requerirApiKey();
  const respuesta = await axios.post(`${BORICUAS_API_URL}/ventas`, datos, {
    headers: { 'x-api-key': BORICUAS_API_KEY },
    validateStatus: () => true,
  });
  if (respuesta.status >= 400) {
    throw Object.assign(new Error(respuesta.data?.mensaje || 'Boricuas rechazó la venta'), {
      status: respuesta.status,
      detalle: respuesta.data,
    });
  }
  return respuesta.data;
}

export async function firmarVenta(idVenta: number, datos: DatosFirmaBoricuas): Promise<VentaBoricuas> {
  requerirApiKey();
  const respuesta = await axios.post(`${BORICUAS_API_URL}/ventas/${idVenta}/firmar`, datos, {
    headers: { 'x-api-key': BORICUAS_API_KEY },
    validateStatus: () => true,
  });
  if (respuesta.status >= 400) {
    throw Object.assign(new Error(respuesta.data?.mensaje || 'Boricuas rechazó la firma'), {
      status: respuesta.status,
      detalle: respuesta.data,
    });
  }
  return respuesta.data;
}

export async function consultarVenta(idVenta: number): Promise<VentaBoricuas> {
  requerirApiKey();
  const respuesta = await axios.get(`${BORICUAS_API_URL}/ventas/${idVenta}`, {
    headers: { 'x-api-key': BORICUAS_API_KEY },
    validateStatus: () => true,
  });
  if (respuesta.status >= 400) {
    throw Object.assign(new Error(respuesta.data?.mensaje || 'No se pudo consultar la venta'), {
      status: respuesta.status,
      detalle: respuesta.data,
    });
  }
  return respuesta.data;
}
