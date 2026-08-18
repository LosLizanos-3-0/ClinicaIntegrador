import api from "./api";

export interface DetalleRecetaBD {
  IdDetalleReceta: number;
  IdReceta: number;
  IdMedicamento: number;
  Cantidad: number;
  Indicaciones: string | null;
  IncluirFactura: boolean;
  Estado: "A" | "I";
}

export const detalleRecetaService = {
  async listar(): Promise<DetalleRecetaBD[]> {
    const { data } = await api.get<DetalleRecetaBD[]>("/detalle-receta");
    return data;
  },

  async crear(datos: {
    IdReceta: number;
    IdMedicamento: number;
    Cantidad: number;
    Indicaciones?: string;
  }): Promise<void> {
    await api.post("/detalle-receta", {
      IdReceta: datos.IdReceta,
      IdMedicamento: datos.IdMedicamento,
      Cantidad: datos.Cantidad,
      Indicaciones: datos.Indicaciones || null,
    });
  },

  // Checkbox del frontend: "cobrar aqui" / "lo retiro en otra farmacia"
  async marcarIncluirFactura(idDetalleReceta: number, incluirFactura: boolean): Promise<void> {
    await api.patch(`/detalle-receta/${idDetalleReceta}/incluir-factura`, { IncluirFactura: incluirFactura });
  },
};