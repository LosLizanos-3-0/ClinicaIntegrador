import api from "./api";
import type { CategoriaMedicamento } from "../types/clinica.types";

interface CategoriaMedicamentoBD {
  IdCategoria: number;
  NombreCategoria: string;
  Comentario: string | null;
  Estado: "A" | "I";
}

function aFrontend(c: CategoriaMedicamentoBD): CategoriaMedicamento {
  return {
    id: c.IdCategoria,
    nombre: c.NombreCategoria,
    comentario: c.Comentario ?? undefined,
    estado: c.Estado,
  };
}

function aBackend(c: Omit<CategoriaMedicamento, "id" | "estado">) {
  return {
    NombreCategoria: c.nombre,
    Comentario: c.comentario || null,
  };
}

export const categoriaMedicamentoService = {
  async listar(): Promise<CategoriaMedicamento[]> {
    const { data } = await api.get<CategoriaMedicamentoBD[]>("/categorias-medicamento");
    return data.map(aFrontend);
  },

  async crear(c: Omit<CategoriaMedicamento, "id" | "estado">) {
    await api.post("/categorias-medicamento", aBackend(c));
  },

  async actualizar(id: number, c: Omit<CategoriaMedicamento, "id" | "estado">) {
    await api.put(`/categorias-medicamento/${id}`, aBackend(c));
  },

  async cambiarEstado(id: number, estadoActual: "A" | "I") {
    await api.patch(`/categorias-medicamento/${id}/estado`, {
      Estado: estadoActual === "A" ? "I" : "A",
    });
  },
};
