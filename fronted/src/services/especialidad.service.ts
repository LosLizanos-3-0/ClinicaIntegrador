import api from "./api";
import type { Especialidad } from "../types/clinica.types";

interface EspecialidadBD {
  IdEspecialidad: number;
  Estado: "A" | "I";
  NombreEspecialidad: string;
}

function aFrontend(e: EspecialidadBD): Especialidad {
  return {
    id: e.IdEspecialidad,
    nombre: e.NombreEspecialidad,
    codigo: `ESP-${e.IdEspecialidad}`,
    icono: "🏥",
    colorFondo: "avatar-blue",
    estado: e.Estado === "A" ? "Activa" : "Inactiva",
    medicos: 0,
    consultorios: 0,
    tags: [],
  };
}

export const especialidadService = {
  async listar(): Promise<Especialidad[]> {
    const { data } = await api.get<EspecialidadBD[]>("/especialidades");
    return data.map(aFrontend);
  },

  async crear(nombre: string) {
    await api.post("/especialidades", { Estado: "A", NombreEspecialidad: nombre });
  },

  async actualizar(id: number, nombre: string, estado: "Activa" | "Inactiva") {
    await api.put(`/especialidades/${id}`, {
      Estado: estado === "Activa" ? "A" : "I",
      NombreEspecialidad: nombre,
    });
  },

  async toggleEstado(id: number, estadoActual: "Activa" | "Inactiva") {
    await api.patch(`/especialidades/${id}/estado`, {
      Estado: estadoActual === "Activa" ? "I" : "A",
    });
  },
};