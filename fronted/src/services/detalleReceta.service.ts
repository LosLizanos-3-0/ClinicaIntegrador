import api from "./api";

export interface DetalleRecetaBD {
  IdDetalleReceta: number;
  IdReceta: number;
  IdMedicamento: number;
  Cantidad: number;
  Indicaciones: string | null;
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
};