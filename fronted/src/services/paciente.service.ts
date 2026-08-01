import api from "./api";
import type { Paciente } from "../types/clinica.types";

interface PacienteBD {
  IdPaciente: number;
  Nombre: string;
  Apellido1: string;
  Apellido2: string | null;
  Cedula: string;
  FechaNacimiento: string;
  Estado: "A" | "I";
  Sexo: "Masculino" | "Femenino";
  Telefono: string | null;
  Correo: string | null;
  Direccion: string | null;
  FechaRegistro: string;
}

function aFrontend(p: PacienteBD): Paciente {
  return {
    id: p.IdPaciente,
    nombre: p.Nombre,
    apellido1: p.Apellido1,
    apellido2: p.Apellido2 ?? "",
    cedula: p.Cedula,
    fechaNacimiento: p.FechaNacimiento?.split("T")[0] ?? "",
    correo: p.Correo ?? "",
    telefono: p.Telefono ?? "",
    registro: new Date(p.FechaRegistro).toLocaleDateString("es-CR"),
    estado: p.Estado === "A" ? "Activo" : "Inactivo",
    sexo: p.Sexo,
    direccion: p.Direccion ?? ""
  };
}

function aBackend(p: Omit<Paciente, "id" | "registro">) {
  return {
    Nombre: p.nombre,
    Apellido1: p.apellido1,
    Apellido2: p.apellido2 || null,
    Cedula: p.cedula,
    FechaNacimiento: p.fechaNacimiento,
    Estado: p.estado === "Activo" ? "A" : "I",
    Sexo: p.sexo,
    Telefono: p.telefono || null,
    Correo: p.correo || null,
    Direccion: p.direccion || null
  };
}

export const pacienteService = {
  async listar(): Promise<Paciente[]> {
    const { data } = await api.get<PacienteBD[]>("/pacientes");
    return data.map(aFrontend);
  },

  async buscarPorNombre(nombre: string): Promise<Paciente[]> {
    const { data } = await api.get<PacienteBD[]>(`/pacientes/buscar/${encodeURIComponent(nombre)}`);
    return data.map(aFrontend);
  },

  async crear(p: Omit<Paciente, "id" | "registro">) {
    await api.post("/pacientes", aBackend(p));
  },

  async actualizar(id: number, p: Omit<Paciente, "id" | "registro">) {
    await api.put(`/pacientes/${id}`, aBackend(p));
  },

  async cambiarEstado(id: number, estadoActual: Paciente["estado"]) {
    await api.patch(`/pacientes/${id}/estado`, {
      Estado: estadoActual === "Activo" ? "I" : "A",
    });
  },
};