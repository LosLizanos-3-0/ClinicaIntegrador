import api from "./api";
import type { Factura } from "../types/clinica.types";
import { calcularIva, calcularTotalConIva, CLINICA_IDENTIFICACION, CLINICA_NOMBRE, CLINICA_CORREO } from "./factura.service";

// Catálogo de medios de pago de Hacienda (aproximado — ajusta si tus
// compañeros usan códigos distintos en su validación).
const MEDIO_PAGO_A_CODIGO: Record<string, string> = {
  Efectivo: "01",
  Tarjeta: "02",
  Transferencia: "04",
  "Sinpe Móvil": "05",
};

export interface ResultadoEnvioTributacion {
  ok: boolean;
  estado?: "Aceptada" | "Rechazada";
  numeroAcuse?: number;
  motivo?: string | null;
  camposFaltantes?: string[];
  mensaje: string;
}

/**
 * Envía una factura firmada a Mini Tributación Directa. La petición pasa
 * por TU backend (que actúa de intermediario, sin problema de CORS) en
 * vez de llamarse directo desde el navegador.
 */
export async function enviarFacturaATributacion(
  factura: Factura,
  xmlFirmado: string
): Promise<ResultadoEnvioTributacion> {
  const subtotal = factura.total;
  const iva = calcularIva(subtotal);
  const totalConIva = calcularTotalConIva(subtotal);

  const itemsFactura = [
    {
      detalle: "Consulta médica",
      cantidad: 1,
      precioUnitario: factura.montoConsulta,
      montoTotalLinea: Math.round(factura.montoConsulta * (1 + 0.13)),
    },
    ...factura.items.map((item) => ({
      detalle: item.concepto,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      montoTotalLinea: Math.round(item.cantidad * item.precioUnitario * (1 + 0.13)),
    })),
  ];

  const payload = {
    id: `FACT-${factura.id}`,
    fecha: new Date().toISOString(),
    moneda: "CRC",
    condicionVenta: "01", // Contado
    medioPago: factura.metodoPago ? (MEDIO_PAGO_A_CODIGO[factura.metodoPago] ?? "01") : "01",
    tipoDocumento: "Factura electrónica",
    emisor: {
      nombre: CLINICA_NOMBRE,
      identificacion: { tipo: "CEDULA_FISICA", numero: CLINICA_IDENTIFICACION },
      correo: CLINICA_CORREO,
    },
    receptor: {
      nombre: factura.paciente,
      identificacion: { tipo: "CEDULA_FISICA", numero: factura.cedulaPaciente },
    },
    items: itemsFactura,
    totales: {
      totalGravado: subtotal,
      totalExento: 0,
      totalDescuentos: 0,
      totalImpuesto: iva,
      totalComprobante: totalConIva,
    },
    archivoXML: xmlFirmado,
  };

  try {
    const { data } = await api.post("/tributacion/facturas", payload);
    return {
      ok: true,
      estado: "Aceptada",
      numeroAcuse: data.numeroAcuse,
      motivo: data.motivo ?? null,
      mensaje: data.mensaje || "Factura electrónica recibida y aceptada correctamente.",
    };
  } catch (error: any) {
    // Nuestro backend reenvía tal cual el status y el body que devolvió
    // Tributación Directa (400/403/404/409 = rechazada, con su motivo).
    const datos = error?.response?.data;
    return {
      ok: false,
      estado: "Rechazada",
      motivo: datos?.motivo ?? null,
      camposFaltantes: datos?.camposFaltantes,
      mensaje: datos?.mensaje || error?.message || "No fue posible comunicarse con Tributación Directa.",
    };
  }
}

/**
 * Reintenta la validación de una factura que había sido rechazada
 * (por ejemplo, si en su momento la clínica no estaba registrada y
 * ya se registró después).
 */
export async function revalidarFacturaTributacion(idExterno: string): Promise<ResultadoEnvioTributacion> {
  try {
    const { data } = await api.post(`/tributacion/facturas/${idExterno}/revalidar`);
    return { ok: true, estado: "Aceptada", motivo: data.motivo ?? null, mensaje: data.mensaje };
  } catch (error: any) {
    const datos = error?.response?.data;
    return {
      ok: false,
      estado: datos?.estado,
      motivo: datos?.motivo ?? null,
      mensaje: datos?.mensaje || error?.message || "No se pudo revalidar la factura.",
    };
  }
}