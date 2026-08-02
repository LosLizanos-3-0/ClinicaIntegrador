import api from "./api";

export interface DetalleFacturaBD {
  IdDetalleFactura: number;
  IdFactura: number;
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

  async crear(datos: {
    IdFactura: number;
    Concepto: string;
    Cantidad: number;
    PrecioUnitario: number;
    Subtotal: number;
  }): Promise<void> {
    await api.post("/detalle-factura", datos);
  },

  async camEstado(idDetalleFactura: number, estado: "A" | "I"): Promise<void> {
    await api.patch(`/detalle-factura/${idDetalleFactura}/estado`, { Estado: estado });
  },
};