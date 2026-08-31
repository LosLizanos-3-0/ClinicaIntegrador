import api from "./api";

export interface VentaBoricuas {
  id: number;
  estado: string;
  xmlOriginal?: string;
  mensaje?: string;
  numeroAcuse?: string;
  motivo?: string | null;
}

export interface ResultadoFacturacionDigital {
  ok: boolean;
  estado?: string;
  numeroAcuse?: string;
  motivo?: string | null;
  mensaje: string;
}

/**
 * Flujo completo de facturación digital con Boricuas:
 * 1) crea la venta en Boricuas y obtiene el XML sin firmar,
 * 2) el llamador firma ese XML con HSM Sign CR,
 * 3) se envía la firma aquí y Boricuas la valida y la manda a Mini
 *    Tributación (DGTD).
 */
export async function crearVentaBoricuas(idFactura: number): Promise<VentaBoricuas> {
  const { data } = await api.post<VentaBoricuas>(`/facturacion-digital/facturas/${idFactura}/venta`);
  return data;
}

export async function firmarVentaBoricuas(
  idVenta: number,
  datos: { xmlFirmado: string; hashDocumento?: string; serialCertificado?: string },
): Promise<ResultadoFacturacionDigital> {
  try {
    const { data } = await api.post<VentaBoricuas>(`/facturacion-digital/ventas/${idVenta}/firmar`, datos);
    return {
      ok: data.estado === "aceptada",
      estado: data.estado,
      numeroAcuse: data.numeroAcuse,
      motivo: data.motivo ?? null,
      mensaje:
        data.estado === "aceptada"
          ? `Factura aceptada por Mini Tributación — acuse ${data.numeroAcuse}.`
          : `Factura rechazada por Mini Tributación: ${data.motivo}.`,
    };
  } catch (error: any) {
    const datos = error?.response?.data;
    return {
      ok: false,
      motivo: datos?.motivo ?? null,
      mensaje: datos?.mensaje || error?.message || "No fue posible comunicarse con Boricuas.",
    };
  }
}
