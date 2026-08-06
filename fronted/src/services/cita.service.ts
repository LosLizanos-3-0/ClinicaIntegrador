import api from "./api";
import type { Cita } from "../types/clinica.types";
import type { UsuarioClinica, EspecialidadClinica } from "../types/clinicaStore";
import type { Paciente } from "../types/clinica.types";

interface CitaBD {
  IdCita: number;
  IdPaciente: number;
  IdEspecialidad: number;
  IdUsuario: number;
  FechaCita: string;
  HoraCita: string;
  Estado: string;
  Motivo: string | null;
}

function formatearHora(horaCruda: string): string {
  if (!horaCruda) return "";
  const parteHora = horaCruda.includes("T") ? horaCruda.split("T")[1] : horaCruda;
  return parteHora.slice(0, 5); // "20:41:00.000Z" -> "20:41"
}

export const citaService = {
  async listar(pacientes: Paciente[], medicos: UsuarioClinica[], especialidades: EspecialidadClinica[]): Promise<Cita[]> {
    const { data } = await api.get<CitaBD[]>("/citas");
    return data.map((c) => {
      const paciente = pacientes.find((p) => p.id === c.IdPaciente);
      const medico = medicos.find((m) => m.id === c.IdUsuario);
      // La especialidad de la cita ahora se lee directamente de IdEspecialidad
      // (columna real de la BD), no se deriva del médico — necesario porque
      // un médico puede tener varias especialidades asignadas.
      const especialidad = especialidades.find((e) => e.id === c.IdEspecialidad);
      return {
        id: c.IdCita,
        pacienteId: c.IdPaciente,
        paciente: paciente ? `${paciente.nombre} ${paciente.apellido1} ${paciente.apellido2}` : "",
        cedulaPaciente: paciente?.cedula ?? "",
        medicoId: c.IdUsuario,
        medico: medico ? `${medico.nombre} ${medico.apellido1}` : "",
        especialidadId: c.IdEspecialidad,
        especialidad: especialidad?.nombre ?? "",
        fecha: c.FechaCita?.split("T")[0] ?? "",
        hora: formatearHora(c.HoraCita),
        motivo: c.Motivo ?? "",
        estado: c.Estado as Cita["estado"],
      };
    });
  },

  async crear(datos: {
    IdPaciente: number;
    IdEspecialidad: number;
    IdUsuario: number;
    FechaCita: string;
    HoraCita: string;
    Motivo: string;
  }) {
    await api.post("/citas", datos);
  },

  async actualizarEstado(id: number, nuevoEstado: string) {
    await api.patch(`/citas/${id}/estado`, { Estado: nuevoEstado });
  },

  async reprogramar(
    id: number,
    base: CitaBD,
    cambios: { FechaCita: string; HoraCita: string; Motivo: string; IdUsuario: number; IdEspecialidad: number }
  ) {
    await api.put(`/citas/${id}`, { ...base, ...cambios });
  },
};