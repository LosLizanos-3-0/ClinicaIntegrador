import { Request, Response } from 'express';
import * as FacturaModel from '../models/Factura.model';
import * as PacienteModel from '../models/Paciente.model';
import * as CitaModel from '../models/Cita.model';
import * as DetalleFacturaModel from '../models/DetalleFactura.model';
import {
  mapearFacturaAReserva,
  emitirComprobante,
  previsualizarComprobante,
  descargarComprobante,
  anularComprobante,
} from '../services/Billingkilometer.service';

// Junta todo lo que necesita el adaptador "reserva" de Billing Kilometer
// a partir del IdFactura: la propia factura, el paciente, la cita (para
// fecha/horario) y las líneas de detalle.
async function armarPayload(idFactura: number, medioPago?: string) {
  const factura = await FacturaModel.selectFacturaById(idFactura);
  if (!factura) {
    const error = new Error('Factura no encontrada');
    (error as any).status = 404;
    throw error;
  }

  const paciente = await PacienteModel.selectPacienteById(factura.IdPaciente);
  if (!paciente) {
    const error = new Error('El paciente de esta factura ya no existe');
    (error as any).status = 404;
    throw error;
  }

  const cita = factura.IdCita ? await CitaModel.selectCitaById(factura.IdCita) : undefined;

  // No existe un endpoint que filtre detalle-factura por IdFactura, así
  // que se trae todo el catálogo y se filtra aquí (las líneas activas de
  // esta factura, sin las anuladas).
  const todosLosDetalles = await DetalleFacturaModel.selectDetalleFactura();
  const detalles = todosLosDetalles.filter(
    (d) => d.IdFactura === idFactura && d.Estado !== 'I'
  );

  return mapearFacturaAReserva({ factura, paciente, cita, detalles, medioPago });
}

function enviarPdf(res: Response, resultado: { pdf: Buffer; documentoId: string | null; clave: string | null; consecutivo: string | null; estado: string | null; totalComprobante: string | null }) {
  if (resultado.documentoId) res.setHeader('X-Documento-Id', resultado.documentoId);
  if (resultado.clave) res.setHeader('X-Clave', resultado.clave);
  if (resultado.consecutivo) res.setHeader('X-Consecutivo', resultado.consecutivo);
  if (resultado.estado) res.setHeader('X-Estado', resultado.estado);
  if (resultado.totalComprobante) res.setHeader('X-Total-Comprobante', resultado.totalComprobante);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(resultado.pdf);
}

function manejarError(error: any, res: Response) {
  console.error(error);
  if (error?.validacion) {
    return res.status(error.status || 422).json(error.validacion);
  }
  return res.status(error?.status || 500).json({ error: error?.message || 'Error al procesar el comprobante' });
}

// POST /api/facturas/:id/comprobante
// Emite el comprobante real (numera y consume un consecutivo) y devuelve
// el PDF directo en el cuerpo de la respuesta.
export const emitirComprobanteFactura = async (req: Request, res: Response) => {
  try {
    const idFactura = Number(req.params.id);
    const payload = await armarPayload(idFactura, req.body?.medioPago);
    const resultado = await emitirComprobante(payload, req.body?.plantillaId);
    enviarPdf(res, resultado);
  } catch (error) {
    manejarError(error, res);
  }
};

// POST /api/facturas/:id/comprobante/preview
// Vista previa en HTML, sin numerar ni gastar consecutivo.
export const previsualizarComprobanteFactura = async (req: Request, res: Response) => {
  try {
    const idFactura = Number(req.params.id);
    const payload = await armarPayload(idFactura, req.body?.medioPago);
    const html = await previsualizarComprobante(payload);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    manejarError(error, res);
  }
};

// GET /api/facturas/comprobante/:documentoId/pdf
// Vuelve a descargar un comprobante ya emitido (por id interno o clave).
export const descargarComprobanteFactura = async (req: Request, res: Response) => {
  try {
    const resultado = await descargarComprobante(req.params.documentoId);
    enviarPdf(res, resultado);
  } catch (error) {
    manejarError(error, res);
  }
};

// POST /api/facturas/comprobante/:documentoId/anular
// Anula (o corrige parcialmente) un comprobante mediante nota de crédito.
export const anularComprobanteFactura = async (req: Request, res: Response) => {
  try {
    const { razon, codigo, montoParcial } = req.body;
    if (!razon) {
      return res.status(400).json({ error: 'La razón de anulación es obligatoria' });
    }
    const resultado = await anularComprobante(req.params.documentoId, razon, { codigo, montoParcial });
    enviarPdf(res, resultado);
  } catch (error) {
    manejarError(error, res);
  }
};