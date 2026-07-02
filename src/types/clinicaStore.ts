/**
 * clinicaStore.ts
 * Store global muy simple (sin dependencias externas) para compartir el estado
 * de USUARIOS y ESPECIALIDADES entre distintas pantallas (GestionUsuarios,
 * GestionEspecialidades, etc.) dentro de la misma aplicación.
 *
 * ¿Por qué existe este archivo?
 * Cada componente React tiene su propio estado local (useState) que vive y
 * muere con ese componente. Para que "crear un médico en Usuarios" se refleje
 * automáticamente en "Especialidades" (y viceversa), ambos deben leer y
 * escribir sobre la MISMA fuente de datos. Este store cumple ese rol.
 *
 * Es intencionalmente simple (patrón pub/sub + useSyncExternalStore de React 18)
 * para que sea fácil de reemplazar más adelante por llamadas reales a tu API
 * / backend, sin tener que tocar los componentes que lo consumen.
 */

import { useSyncExternalStore } from "react";
import type {
  Usuario,
  RolUsuario,
  EstadoUsuario,
  Especialidad,
  EstadoEspecialidad,
} from "./clinica.types";

// ─── Tipos extendidos ──────────────────────────────────────────────────────
// Un usuario con rol "Médico" puede tener una especialidad asociada (por id).
// Para los demás roles (Administrador, Recepcionista, Farmacéutico, Enfermera)
// este campo se deja vacío y la UI debe mostrar "—".
export interface UsuarioClinica extends Usuario {
  especialidadId?: number;
}

export type EspecialidadClinica = Especialidad;

interface ClinicaState {
  usuarios: UsuarioClinica[];
  especialidades: EspecialidadClinica[];
}

// ─── Datos iniciales (mock) ────────────────────────────────────────────────
const ESPECIALIDADES_INICIALES: EspecialidadClinica[] = [
  { id: 1, nombre: "Cardiología",       codigo: "COD-001", icono: "❤️",  colorFondo: "avatar-blue",     estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Urgencias"] },
  { id: 2, nombre: "Pediatría",         codigo: "COD-002", icono: "🧸",  colorFondo: "avatar-emerald",  estado: "Activa",   medicos: 0, consultorios: 4, tags: ["Niños", "Neonatos"] },
  { id: 3, nombre: "Ginecología",       codigo: "COD-003", icono: "🌸",  colorFondo: "avatar-pink",     estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Obstétrica"] },
  { id: 4, nombre: "Neurología",        codigo: "COD-004", icono: "🧠",  colorFondo: "avatar-purple",   estado: "Activa",   medicos: 0, consultorios: 2, tags: ["Adultos"] },
  { id: 5, nombre: "Traumatología",     codigo: "COD-005", icono: "🦴",  colorFondo: "avatar-amber",    estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Cirugía"] },
  { id: 6, nombre: "Patología clínica", codigo: "COD-010", icono: "🔬",  colorFondo: "badge-soft-gray", estado: "Inactiva", medicos: 0, consultorios: 1, tags: ["Sin actividad"] },
];
// Nota: el campo numérico `medicos` de cada especialidad ya NO es la fuente de
// verdad del conteo (se deja en 0 / se ignora en pantalla). El conteo real se
// calcula siempre a partir de `usuarios` filtrando por `especialidadId`, para
// evitar que ambos números se desincronicen.

const USUARIOS_INICIALES: UsuarioClinica[] = [
  { id: 1, nombre: "Dr. Rafael Morales", correo: "r.morales@clinica.com",  rol: "Médico",        estado: "Activo",   ingreso: "12/01/2023", iniciales: "RM", especialidadId: 1 },
  { id: 2, nombre: "Lucía Vargas",       correo: "l.vargas@clinica.com",   rol: "Recepcionista", estado: "Activo",   ingreso: "03/03/2024", iniciales: "LV" },
  { id: 4, nombre: "Jorge Castillo",     correo: "j.castillo@clinica.com", rol: "Administrador", estado: "Inactivo", ingreso: "01/01/2021", iniciales: "JC" },
  { id: 5, nombre: "Dra. Sandra Pérez",  correo: "s.perez@clinica.com",    rol: "Médico",        estado: "Activo",   ingreso: "15/08/2023", iniciales: "SP", especialidadId: 2 },
  { id: 6, nombre: "Carlos Ramírez",     correo: "c.ramirez@clinica.com",  rol: "Farmacéutico",  estado: "Activo",   ingreso: "10/02/2024", iniciales: "CR" },
  { id: 7, nombre: "Dr. Esteban Vargas", correo: "e.vargas@clinica.com",   rol: "Médico",        estado: "Activo",   ingreso: "20/05/2023", iniciales: "EV", especialidadId: 1 },
  { id: 8, nombre: "Dra. Karina Méndez", correo: "k.mendez@clinica.com",   rol: "Médico",        estado: "Activo",   ingreso: "02/09/2023", iniciales: "KM", especialidadId: 3 },
  { id: 9, nombre: "Dr. Manuel Araya",   correo: "m.araya@clinica.com",    rol: "Médico",        estado: "Activo",   ingreso: "14/11/2023", iniciales: "MA", especialidadId: 4 },
];

// ─── Implementación del store (patrón pub/sub) ────────────────────────────
let state: ClinicaState = {
  usuarios: USUARIOS_INICIALES,
  especialidades: ESPECIALIDADES_INICIALES,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ClinicaState {
  return state;
}

// ─── Acciones: usuarios ────────────────────────────────────────────────────
function setUsuarios(updater: (prev: UsuarioClinica[]) => UsuarioClinica[]) {
  state = { ...state, usuarios: updater(state.usuarios) };
  emitChange();
}

function crearUsuario(usuario: Omit<UsuarioClinica, "id">) {
  const nuevo: UsuarioClinica = { ...usuario, id: Date.now() };
  setUsuarios((prev) => [...prev, nuevo]);
  return nuevo;
}

function actualizarUsuario(usuario: UsuarioClinica) {
  setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? usuario : u)));
}

function toggleEstadoUsuario(id: number) {
  setUsuarios((prev) =>
    prev.map((u) =>
      u.id === id ? { ...u, estado: (u.estado === "Activo" ? "Inactivo" : "Activo") as EstadoUsuario } : u
    )
  );
}

// Asigna / quita la especialidad de un médico (usado desde ambas pantallas)
function asignarEspecialidadAMedico(usuarioId: number, especialidadId: number) {
  setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, especialidadId } : u)));
}

function quitarEspecialidadDeMedico(usuarioId: number) {
  setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, especialidadId: undefined } : u)));
}

// ─── Acciones: especialidades ──────────────────────────────────────────────
function setEspecialidades(updater: (prev: EspecialidadClinica[]) => EspecialidadClinica[]) {
  state = { ...state, especialidades: updater(state.especialidades) };
  emitChange();
}

function crearEspecialidad(especialidad: Omit<EspecialidadClinica, "id">) {
  const nueva: EspecialidadClinica = { ...especialidad, id: Date.now() };
  setEspecialidades((prev) => [...prev, nueva]);
  return nueva;
}

function actualizarEspecialidad(especialidad: EspecialidadClinica) {
  setEspecialidades((prev) => prev.map((e) => (e.id === especialidad.id ? especialidad : e)));
}

function eliminarEspecialidad(id: number) {
  setEspecialidades((prev) => prev.filter((e) => e.id !== id));
  // Los médicos que tenían esta especialidad quedan sin especialidad asignada.
  setUsuarios((prev) => prev.map((u) => (u.especialidadId === id ? { ...u, especialidadId: undefined } : u)));
}

// ─── Selectores ─────────────────────────────────────────────────────────────
function medicosDeEspecialidad(state: ClinicaState, especialidadId: number): UsuarioClinica[] {
  return state.usuarios.filter((u) => u.rol === "Médico" && u.especialidadId === especialidadId);
}

function nombreEspecialidad(state: ClinicaState, especialidadId?: number): string {
  if (!especialidadId) return "—";
  return state.especialidades.find((e) => e.id === especialidadId)?.nombre ?? "—";
}

// ─── API pública del store ──────────────────────────────────────────────────
export const clinicaStore = {
  subscribe,
  getSnapshot,
  crearUsuario,
  actualizarUsuario,
  toggleEstadoUsuario,
  asignarEspecialidadAMedico,
  quitarEspecialidadDeMedico,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
  medicosDeEspecialidad,
  nombreEspecialidad,
};

// Hook para consumir el store desde cualquier componente.
// Se re-renderiza automáticamente cuando cambian usuarios o especialidades,
// sin importar desde qué pantalla se originó el cambio.
export function useClinicaStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
