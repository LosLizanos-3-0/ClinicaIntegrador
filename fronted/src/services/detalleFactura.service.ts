import api from "./api";

export interface DetalleFacturaBD {
  IdDetalleFactura: number;
  IdFactura: number;
  IdDetalleReceta: number | null;
  Concepto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
  Estado: "A" | "I";
}

export const detalleFacturaService = {
  async listar(): Promise<DetalleFacturaBD[]> {
    const { data } = await api.get<DetalleFacturaBD[]>("/detalle-factura");
    return data;
  },

  // Para lineas manuales (ej. la consulta si se maneja como linea aparte).
  // El Subtotal ya no se envia: la base de datos lo calcula sola.
  async crear(datos: {
    IdFactura: number;
    Concepto: string;
    Cantidad: number;
    PrecioUnitario: number;
    IdDetalleReceta?: number;
  }): Promise<void> {
    await api.post("/detalle-factura", datos);
  },

  async camEstado(idDetalleFactura: number, estado: "A" | "I"): Promise<void> {
    await api.patch(`/detalle-factura/${idDetalleFactura}/estado`, { Estado: estado });
  },
};