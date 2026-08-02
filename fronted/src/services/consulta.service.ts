import api from "./api";
import type { ConsultaMedica } from "../types/clinica.types";

interface ConsultaBD {
  IdConsulta: number;
  IdExpediente: number;
  IdCita: number | null;
  IdUsuario: number;
  FechaConsulta: string;
  Diagnostico: string | null;
  Tratamiento: string | null;
  Estado: "A" | "I";
}

function aFrontend(c: ConsultaBD): ConsultaMedica {
  return {
    id: c.IdConsulta,
    expedienteId: c.IdExpediente,
    citaId: c.IdCita ?? undefined,
    medicoId: c.IdUsuario,
    fecha: c.FechaConsulta,
    diagnostico: c.Diagnostico ?? undefined,
    tratamiento: c.Tratamiento ?? undefined,
  };
}

export const consultaService = {
  async listar(): Promise<ConsultaMedica[]> {
    const { data } = await api.get<ConsultaBD[]>("/consultas");
    return data.map(aFrontend);
  },

  async crear(datos: {
    IdExpediente: number;
    IdCita?: number;
    IdUsuario: number;
    Diagnostico?: string;
    Tratamiento?: string;
  }): Promise<number> {
    await api.post("/consultas", {
      IdExpediente: datos.IdExpediente,
      IdCita: datos.IdCita ?? null,
      IdUsuario: datos.IdUsuario,
      Diagnostico: datos.Diagnostico || null,
      Tratamiento: datos.Tratamiento || null,
    });
    const { data: consultas } = await api.get<ConsultaBD[]>("/consultas");
    const creada = consultas.sort((a, b) => b.IdConsulta - a.IdConsulta)[0];
    return creada.IdConsulta;
  },
};