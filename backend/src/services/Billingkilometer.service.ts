/*
 * Integración con Billing Kilometer: microservicio de facturación
 * electrónica (Costa Rica, anexo v4.4). ClinicaIntegrador arma el cobro
 * ya resuelto (sin calcular impuestos por su cuenta, eso lo hace cada
 * adaptador) y Billing Kilometer devuelve el PDF del comprobante listo.
 *
 * Esto vive en el BACKEND, nunca en el frontend: la llamada requiere la
 * API key de la cuenta (x-api-key), que no debe llegar nunca al navegador
 * del usuario. El frontend solo llama a nuestros propios endpoints de
 * /api/facturas/:id/comprobante, y este servicio es el único que conoce
 * la llave real.
 */

import { Factura, Paciente, Cita, DetalleFactura } from '../types';

// En producción esta variable de entorno debe apuntar al back-URL real
// de Billing Kilometer indicado en la guía de integración.
const BILLING_KILOMETER_URL =
  process.env.BILLING_KILOMETER_URL || 'https://facturapi-bk-production.up.railway.app';

// Se obtiene registrando la cuenta en el panel de Billing Kilometer y
// generando una llave desde la pantalla Integración. Solo se muestra una
// vez al crearla, así que se guarda directo en variables de entorno.
const BILLING_KILOMETER_KEY = process.env.BILLING_KILOMETER_KEY || '';

const ADAPTADOR_CLINICA = 'reserva';

export interface ComprobanteResultado {
  pdf: Buffer;
  documentoId: string | null;
  clave: string | null;
  consecutivo: string | null;
  estado: string | null;
  totalComprobante: string | null;
}

export interface ErrorValidacionBillingKilometer {
  error: string;
  mensaje?: string;
  cantidadErrores?: number;
  detalles?: { campo: string; regla: string; mensaje: string }[];
  documentacion?: string;
}

function requerirApiKey() {
  if (!BILLING_KILOMETER_KEY) {
    throw new Error(
      'Falta configurar BILLING_KILOMETER_KEY en el .env del backend antes de poder emitir comprobantes.'
    );
  }
}

// Traduce un tipo de identificación libre (lo que haya en Paciente.Cedula,
// o el criterio de negocio propio) al código que exige el anexo v4.4.
// Por ahora ClinicaIntegrador solo maneja pacientes con cédula física.
function tipoIdentificacionPorDefecto(): string {
  return '01'; // Cédula Física
}

/**
 * Arma el cuerpo del adaptador "reserva" (el que usa ClinicaIntegrador
 * para todas sus facturas: una consulta o servicio médico es, para
 * efectos de Billing Kilometer, una reserva/cita cobrada) a partir de
 * los datos que ya existen en la base de datos de la clínica.
 */
export function mapearFacturaAReserva(datos: {
  factura: Factura;
  paciente: Paciente;
  cita?: Cita;
  detalles: DetalleFactura[];
  medioPago?: string;
}): Record<string, unknown> {
  const { factura, paciente, cita, detalles, medioPago } = datos;

  const nombreCompleto = [paciente.Nombre, paciente.Apellido1, paciente.Apellido2]
    .filter(Boolean)
    .join(' ');

  // Si la factura no tiene líneas propias en DetalleFactura (consultas
  // simples sin medicamentos), se arma una sola línea con el monto de
  // consulta para que el comprobante nunca salga vacío.
  const lineasFuente =
    detalles.length > 0
      ? detalles
      : [
          {
            Concepto: 'Consulta médica',
            Cantidad: 1,
            PrecioUnitario: factura.MontoConsulta ?? factura.Total ?? 0,
          } as DetalleFactura,
        ];

  const servicios = lineasFuente.map((linea) => {
    const cantidad = linea.Cantidad ?? 1;
    const precioUnitario = linea.PrecioUnitario ?? 0;
    const montoTotal = cantidad * precioUnitario;

    // Nota: aquí se asume tarifa general (13%, código 08) porque es el
    // catálogo por defecto de los adaptadores con líneas. Si en algún
    // momento la clínica maneja servicios exentos, este cálculo debe
    // ajustarse por línea antes de enviarlo.
    const montoImpuesto = Math.round(montoTotal * 0.13 * 100) / 100;

    return {
      descripcion: linea.Concepto,
      cantidad,
      unidad: 'Unid',
      precioUnitario,
      montoTotal,
      subTotal: montoTotal,
      baseImponible: montoTotal,
      montoImpuesto,
      impuestoNeto: montoImpuesto,
      totalLinea: montoTotal + montoImpuesto,
    };
  });

  const gravado = servicios.reduce((acc, s) => acc + s.montoTotal, 0);
  const impuesto = servicios.reduce((acc, s) => acc + s.montoImpuesto, 0);

  return {
    adaptador: ADAPTADOR_CLINICA,
    cliente: {
      nombre: nombreCompleto,
      tipoIdentificacion: tipoIdentificacionPorDefecto(),
      identificacion: paciente.Cedula,
      email: paciente.Correo || undefined,
    },
    medioPago: medioPago || undefined,
    fechaServicio: cita?.FechaCita ? `Fecha: ${cita.FechaCita}` : undefined,
    horario: cita?.HoraCita ? `Horario: ${cita.HoraCita}` : undefined,
    servicios,
    totales: {
      serviciosGravados: gravado,
      gravado,
      venta: gravado,
      ventaNeta: gravado,
      impuesto,
      total: gravado + impuesto,
    },
  };
}

async function leerRespuestaComoError(respuesta: Response): Promise<ErrorValidacionBillingKilometer> {
  try {
    return await respuesta.json();
  } catch {
    return { error: 'ERROR_DESCONOCIDO', mensaje: await respuesta.text() };
  }
}

function extraerMetadatos(respuesta: Response) {
  return {
    documentoId: respuesta.headers.get('X-Documento-Id'),
    clave: respuesta.headers.get('X-Clave'),
    consecutivo: respuesta.headers.get('X-Consecutivo'),
    estado: respuesta.headers.get('X-Estado'),
    totalComprobante: respuesta.headers.get('X-Total-Comprobante'),
  };
}

/**
 * Emite el comprobante real: numera, consume un consecutivo y guarda el
 * comprobante en Billing Kilometer. Devuelve el PDF junto con los
 * metadatos fiscales (clave, consecutivo, etc.) que viajan en encabezados.
 */
export async function emitirComprobante(
  payload: Record<string, unknown>,
  plantillaId?: string
): Promise<ComprobanteResultado> {
  requerirApiKey();

  const respuesta = await fetch(`${BILLING_KILOMETER_URL}/api/v1/documents`, {
    method: 'POST',
    headers: {
      'x-api-key': BILLING_KILOMETER_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plantillaId ? { ...payload, plantillaId } : payload),
  });

  if (!respuesta.ok) {
    const error = await leerRespuestaComoError(respuesta);
    throw Object.assign(
      new Error(error.mensaje || error.error || 'No se pudo emitir el comprobante'),
      { validacion: error, status: respuesta.status }
    );
  }

  const pdf = Buffer.from(await respuesta.arrayBuffer());
  return { pdf, ...extraerMetadatos(respuesta) };
}

/**
 * Genera una vista previa (HTML) sin numerar ni gastar un consecutivo.
 * Útil para un botón "Vista previa" antes de emitir el comprobante real.
 */
export async function previsualizarComprobante(payload: Record<string, unknown>): Promise<string> {
  requerirApiKey();

  const respuesta = await fetch(`${BILLING_KILOMETER_URL}/api/v1/documents/preview`, {
    method: 'POST',
    headers: {
      'x-api-key': BILLING_KILOMETER_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!respuesta.ok) {
    const error = await leerRespuestaComoError(respuesta);
    throw Object.assign(
      new Error(error.mensaje || error.error || 'No se pudo generar la vista previa'),
      { validacion: error, status: respuesta.status }
    );
  }

  return respuesta.text();
}

/**
 * Vuelve a descargar el PDF de un comprobante ya emitido (por su
 * identificador interno o su clave de 50 dígitos), sin gastar un
 * consecutivo nuevo. Sirve para reimprimir o reenviar un comprobante.
 */
export async function descargarComprobante(idODocumentoOClave: string): Promise<ComprobanteResultado> {
  requerirApiKey();

  const respuesta = await fetch(
    `${BILLING_KILOMETER_URL}/api/v1/documents/${encodeURIComponent(idODocumentoOClave)}/pdf`,
    { headers: { 'x-api-key': BILLING_KILOMETER_KEY } }
  );

  if (!respuesta.ok) {
    const error = await leerRespuestaComoError(respuesta);
    throw Object.assign(
      new Error(error.mensaje || error.error || 'No se pudo descargar el comprobante'),
      { validacion: error, status: respuesta.status }
    );
  }

  const pdf = Buffer.from(await respuesta.arrayBuffer());
  return { pdf, ...extraerMetadatos(respuesta) };
}

/**
 * Anula (o corrige parcialmente) un comprobante ya emitido mediante una
 * nota de crédito. Por defecto anula el total (código "01").
 */
export async function anularComprobante(
  idODocumentoOClave: string,
  razon: string,
  opciones?: { codigo?: string; montoParcial?: number }
): Promise<ComprobanteResultado> {
  requerirApiKey();

  const respuesta = await fetch(
    `${BILLING_KILOMETER_URL}/api/v1/documents/${encodeURIComponent(idODocumentoOClave)}/nota-credito`,
    {
      method: 'POST',
      headers: {
        'x-api-key': BILLING_KILOMETER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razon,
        codigo: opciones?.codigo ?? '01',
        montoParcial: opciones?.montoParcial ?? null,
      }),
    }
  );

  if (!respuesta.ok) {
    const error = await leerRespuestaComoError(respuesta);
    throw Object.assign(
      new Error(error.mensaje || error.error || 'No se pudo generar la nota de crédito'),
      { validacion: error, status: respuesta.status }
    );
  }

  const pdf = Buffer.from(await respuesta.arrayBuffer());
  return { pdf, ...extraerMetadatos(respuesta) };
}