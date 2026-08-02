import api from "./api";

export interface EntregaMedicamentoBD {
  IdEntrega: number;
  IdReceta: number;
  IdUsuario: number;
  FechaEntrega: string;
  Estado: "A" | "I";
}

export const entregaMedicamentoService = {
  async crear(datos: { IdReceta: number; IdUsuario: number }): Promise<void> {
    await api.post("/entregas", {
      IdReceta: datos.IdReceta,
      IdUsuario: datos.IdUsuario,
    });
  },

  async listar(): Promise<EntregaMedicamentoBD[]> {
    const { data } = await api.get<EntregaMedicamentoBD[]>("/entregas");
    return data;
  },

  async camEstado(idEntrega: number, estado: "A" | "I"): Promise<void> {
    await api.patch(`/entregas/${idEntrega}/estado`, { Estado: estado });
  },
};