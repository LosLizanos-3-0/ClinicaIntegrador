import api from "./api";
import type { Cita } from "../types/clinica.types";
import type { UsuarioClinica, EspecialidadClinica } from "../types/clinicaStore";
import type { Paciente } from "../types/clinica.types";

interface CitaBD {
  IdCita: number;
  IdPaciente: number;
  Idusuario: number;
  FechaCita: string;
  HoraCita: string;
  Estado: string;
  Motivo: string | null;
}

const ESTADO_A_BD: Record<string, string> = { Programada: "Agendada" };
const ESTADO_A_FRONT: Record<string, string> = { Agendada: "Programada" };

function estadoAFrontend(e: string) {
  return (ESTADO_A_FRONT[e] ?? e) as Cita["estado"];
}
function estadoABackend(e: string) {
  return ESTADO_A_BD[e] ?? e;
}

// Junta los nombres de las especialidades del médico, ej: "Cardiología/Urología"
function especialidadDelMedico(medico: UsuarioClinica | undefined, especialidades: EspecialidadClinica[]): string {
  if (!medico) return "";
  const nombres = (medico.especialidadIds ?? [])
    .map((id) => especialidades.find((e) => e.id === id)?.nombre)
    .filter((n): n is string => !!n);
  return nombres.join("/");
}

export const citaService = {
  async listar(pacientes: Paciente[], medicos: UsuarioClinica[], especialidades: EspecialidadClinica[]): Promise<Cita[]> {
    const { data } = await api.get<CitaBD[]>("/citas");
    return data.map((c) => {
      const paciente = pacientes.find((p) => p.id === c.IdPaciente);
      const medico = medicos.find((m) => m.id === c.Idusuario);
      return {
        id: c.IdCita,
        pacienteId: c.IdPaciente,
        paciente: paciente ? `${paciente.nombre} ${paciente.apellido1} ${paciente.apellido2}` : "",
        cedulaPaciente: paciente?.cedula ?? "",
        medicoId: c.Idusuario,
        medico: medico?.nombre ?? "",
        especialidad: especialidadDelMedico(medico, especialidades),
        fecha: c.FechaCita?.split("T")[0] ?? "",
        hora: c.HoraCita,
        motivo: c.Motivo ?? "",
        estado: estadoAFrontend(c.Estado),
      };
    });
  },

  async crear(datos: { IdPaciente: number; IdUsuario: number; FechaCita: string; HoraCita: string; Motivo: string }) {
    await api.post("/citas", { ...datos, Estado: "Agendada" });
  },

  async actualizarEstado(id: number, nuevoEstado: string) {
    await api.patch(`/citas/${id}/estado`, { Estado: estadoABackend(nuevoEstado) });
  },

  async reprogramar(id: number, base: CitaBD, cambios: { FechaCita: string; HoraCita: string; Motivo: string; IdUsuario: number }) {
    await api.put(`/citas/${id}`, { ...base, ...cambios });
  },
};