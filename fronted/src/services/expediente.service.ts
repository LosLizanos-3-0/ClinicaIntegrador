import api from "./api";
import type { ExpedienteMedico } from "../types/clinica.types";

interface ExpedienteBD {
  IdExpediente: number;
  IdPaciente: number;
  IdUsuario: number;
  IdCita: number;
  FechaCreacion: string;
  Observaciones: string | null;
  Estado: "A" | "I";
}

function aFrontend(e: ExpedienteBD): ExpedienteMedico {
  return {
    id: e.IdExpediente,
    pacienteId: e.IdPaciente,
    medicoId: e.IdUsuario,
    citaId: e.IdCita,
    fecha: e.FechaCreacion,
    observaciones: e.Observaciones ?? undefined,
  };
}

export const expedienteService = {
  async listar(): Promise<ExpedienteMedico[]> {
    const { data } = await api.get<ExpedienteBD[]>("/expedientes");
    return data.map(aFrontend);
  },

  async crear(datos: {
    IdPaciente: number;
    IdUsuario: number;
    IdCita: number;
    Observaciones?: string;
  }): Promise<number> {
    await api.post("/expedientes", {
      IdPaciente: datos.IdPaciente,
      IdUsuario: datos.IdUsuario,
      IdCita: datos.IdCita,
      Observaciones: datos.Observaciones || null,
    });
    const { data: expedientes } = await api.get<ExpedienteBD[]>("/expedientes");
    const creado = expedientes.sort((a, b) => b.IdExpediente - a.IdExpediente)[0];
    return creado.IdExpediente;
  },
};