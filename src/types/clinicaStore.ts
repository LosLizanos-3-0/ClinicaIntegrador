import { useSyncExternalStore } from "react";
import type {
  Usuario,
  EstadoUsuario,
  Especialidad,
  Credencial,
  Paciente,
  Medicamento,
  Receta,
  RolUsuario,
} from "./clinica.types";

export interface UsuarioClinica extends Usuario {
  especialidadId?: number;
}

export type EspecialidadClinica = Especialidad;

interface ClinicaState {
  usuarios: UsuarioClinica[];
  especialidades: EspecialidadClinica[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  recetas: Receta[];
  usuarioActual: Credencial | null;
}

const ESPECIALIDADES_INICIALES: EspecialidadClinica[] = [
  { id: 1, nombre: "Cardiología",       codigo: "COD-001", icono: "❤️",  colorFondo: "avatar-blue",     estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Urgencias"] },
  { id: 2, nombre: "Pediatría",         codigo: "COD-002", icono: "🧸",  colorFondo: "avatar-emerald",  estado: "Activa",   medicos: 0, consultorios: 4, tags: ["Niños", "Neonatos"] },
  { id: 3, nombre: "Ginecología",       codigo: "COD-003", icono: "🌸",  colorFondo: "avatar-pink",     estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Obstétrica"] },
  { id: 4, nombre: "Neurología",        codigo: "COD-004", icono: "🧠",  colorFondo: "avatar-purple",   estado: "Activa",   medicos: 0, consultorios: 2, tags: ["Adultos"] },
  { id: 5, nombre: "Traumatología",     codigo: "COD-005", icono: "🦴",  colorFondo: "avatar-amber",    estado: "Activa",   medicos: 0, consultorios: 3, tags: ["Adultos", "Cirugía"] },
  { id: 6, nombre: "Patología clínica", codigo: "COD-010", icono: "🔬",  colorFondo: "badge-soft-gray", estado: "Inactiva", medicos: 0, consultorios: 1, tags: ["Sin actividad"] },
];

const USUARIOS_INICIALES: UsuarioClinica[] = [
  { id: 1, nombre: "Dr. Rafael Morales", correo: "r.morales@clinica.com",  rol: "Médico",        estado: "Activo",   ingreso: "12/01/2023", iniciales: "RM", especialidadId: 1 },
  { id: 2, nombre: "Lucía Vargas",       correo: "l.vargas@clinica.com",   rol: "Recepcionista", estado: "Activo",   ingreso: "03/03/2024", iniciales: "LV" },
  { id: 3, nombre: "Andrea Salas",       correo: "a.salas@clinica.com",    rol: "Administrador", estado: "Activo",   ingreso: "05/06/2022", iniciales: "AS" },
  { id: 4, nombre: "Jorge Castillo",     correo: "j.castillo@clinica.com", rol: "Administrador", estado: "Inactivo", ingreso: "01/01/2021", iniciales: "JC" },
  { id: 5, nombre: "Dra. Sandra Pérez",  correo: "s.perez@clinica.com",    rol: "Médico",        estado: "Activo",   ingreso: "15/08/2023", iniciales: "SP", especialidadId: 2 },
  { id: 6, nombre: "Carlos Ramírez",     correo: "c.ramirez@clinica.com",  rol: "Farmacéutico",  estado: "Activo",   ingreso: "10/02/2024", iniciales: "CR" },
  { id: 7, nombre: "Dr. Esteban Vargas", correo: "e.vargas@clinica.com",   rol: "Médico",        estado: "Activo",   ingreso: "20/05/2023", iniciales: "EV", especialidadId: 1 },
  { id: 8, nombre: "Dra. Karina Méndez", correo: "k.mendez@clinica.com",   rol: "Médico",        estado: "Activo",   ingreso: "02/09/2023", iniciales: "KM", especialidadId: 3 },
  { id: 9, nombre: "Dr. Manuel Araya",   correo: "m.araya@clinica.com",    rol: "Médico",        estado: "Activo",   ingreso: "14/11/2023", iniciales: "MA", especialidadId: 4 },
];

const PACIENTES_INICIALES: Paciente[] = [
  { id: 1, nombre: "Marcela", apellido1: "Solano", apellido2: "Ureña",   cedula: "1-1234-5678", fechaNacimiento: "1990-04-12", correo: "marcela.solano@gmail.com", telefono: "8888-1234", contrasena: "paciente123", registro: "14/02/2024" },
  { id: 2, nombre: "Diego",   apellido1: "Chinchilla", apellido2: "Rojas", cedula: "1-0987-6543", fechaNacimiento: "1985-11-02", correo: "diego.chinchilla@gmail.com", telefono: "8888-5678", contrasena: "paciente123", registro: "22/03/2024" },
];

const MEDICAMENTOS_INICIALES: Medicamento[] = [
  { id: 1, nombre: "Acetaminofén",  presentacion: "Tableta 500 mg", unidad: "Caja x 20", laboratorio: "Laboratorios Lopez", categoria: "Analgésico",       stock: 120, stockMinimo: 30, precio: 1500 },
  { id: 2, nombre: "Amoxicilina",   presentacion: "Cápsula 500 mg", unidad: "Caja x 15", laboratorio: "Bagó",              categoria: "Antibiótico",      stock: 18,  stockMinimo: 25, precio: 4200 },
  { id: 3, nombre: "Ibuprofeno",    presentacion: "Tableta 400 mg", unidad: "Caja x 24", laboratorio: "Gutis",             categoria: "Antiinflamatorio", stock: 65,  stockMinimo: 20, precio: 2100 },
  { id: 4, nombre: "Loratadina",    presentacion: "Tableta 10 mg",  unidad: "Caja x 10", laboratorio: "Laboratorios Lopez", categoria: "Antialérgico",     stock: 40,  stockMinimo: 15, precio: 1800 },
  { id: 5, nombre: "Losartán",      presentacion: "Tableta 50 mg",  unidad: "Caja x 30", laboratorio: "Bagó",              categoria: "Antihipertensivo", stock: 8,   stockMinimo: 20, precio: 3600 },
  { id: 6, nombre: "Complejo B",    presentacion: "Tableta",        unidad: "Frasco x 100", laboratorio: "Gutis",          categoria: "Vitaminas",        stock: 54,  stockMinimo: 20, precio: 2900 },
];

const RECETAS_INICIALES: Receta[] = [
  {
    id: 1001,
    paciente: "Marcela Solano Ureña",
    cedulaPaciente: "1-1234-5678",
    medico: "Dr. Rafael Morales",
    especialidad: "Cardiología",
    fecha: "28/06/2026",
    estado: "Pendiente",
    items: [
      { medicamentoId: 5, medicamento: "Losartán", cantidad: 1, indicaciones: "1 tableta cada 24 horas por 30 días" },
      { medicamentoId: 1, medicamento: "Acetaminofén", cantidad: 1, indicaciones: "1 tableta cada 8 horas si hay dolor" },
    ],
  },
  {
    id: 1002,
    paciente: "Diego Chinchilla Rojas",
    cedulaPaciente: "1-0987-6543",
    medico: "Dra. Sandra Pérez",
    especialidad: "Pediatría",
    fecha: "29/06/2026",
    estado: "Pendiente",
    items: [
      { medicamentoId: 2, medicamento: "Amoxicilina", cantidad: 1, indicaciones: "1 cápsula cada 8 horas por 7 días" },
    ],
  },
  {
    id: 1003,
    paciente: "Marcela Solano Ureña",
    cedulaPaciente: "1-1234-5678",
    medico: "Dra. Karina Méndez",
    especialidad: "Ginecología",
    fecha: "25/06/2026",
    estado: "Validada",
    items: [
      { medicamentoId: 4, medicamento: "Loratadina", cantidad: 1, indicaciones: "1 tableta al día por 10 días" },
    ],
  },
  {
    id: 1004,
    paciente: "Diego Chinchilla Rojas",
    cedulaPaciente: "1-0987-6543",
    medico: "Dr. Manuel Araya",
    especialidad: "Neurología",
    fecha: "20/06/2026",
    estado: "Entregada",
    items: [
      { medicamentoId: 3, medicamento: "Ibuprofeno", cantidad: 1, indicaciones: "1 tableta cada 12 horas por 5 días" },
      { medicamentoId: 6, medicamento: "Complejo B", cantidad: 1, indicaciones: "1 tableta al día por 30 días" },
    ],
  },
];

const CREDENCIALES_INICIALES: Credencial[] = [
  { usuario: "admin",         contrasena: "123",     rol: "Administrador", nombreCompleto: "Andrea Salas",       iniciales: "AS" },
  { usuario: "medico",        contrasena: "123",    rol: "Médico",        nombreCompleto: "Dr. Rafael Morales", iniciales: "RM" },
  { usuario: "recepcionista", contrasena: "123", rol: "Recepcionista", nombreCompleto: "Lucía Vargas",       iniciales: "LV" },
  { usuario: "farmaceutico",  contrasena: "123",  rol: "Farmacéutico",  nombreCompleto: "Carlos Ramírez",     iniciales: "CR" },
];

let state: ClinicaState = {
  usuarios: USUARIOS_INICIALES,
  especialidades: ESPECIALIDADES_INICIALES,
  pacientes: PACIENTES_INICIALES,
  medicamentos: MEDICAMENTOS_INICIALES,
  recetas: RECETAS_INICIALES,
  usuarioActual: null,
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

function asignarEspecialidadAMedico(usuarioId: number, especialidadId: number) {
  setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, especialidadId } : u)));
}

function quitarEspecialidadDeMedico(usuarioId: number) {
  setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, especialidadId: undefined } : u)));
}

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

// RF03 – Activar / Desactivar especialidad (reemplaza el antiguo "eliminar").
// Mismo patrón que toggleEstadoUsuario: invierte el estado inmutablemente
// y notifica a los suscriptores (useSyncExternalStore) para re-render.
function toggleEstadoEspecialidad(id: number) {
  setEspecialidades((prev) =>
    prev.map((e) =>
      e.id === id ? { ...e, estado: (e.estado === "Activa" ? "Inactiva" : "Activa") as EspecialidadClinica["estado"] } : e
    )
  );
}

function eliminarEspecialidad(id: number) {
  setEspecialidades((prev) => prev.filter((e) => e.id !== id));
  setUsuarios((prev) => prev.map((u) => (u.especialidadId === id ? { ...u, especialidadId: undefined } : u)));
}

function medicosDeEspecialidad(state: ClinicaState, especialidadId: number): UsuarioClinica[] {
  return state.usuarios.filter((u) => u.rol === "Médico" && u.especialidadId === especialidadId);
}

function nombreEspecialidad(state: ClinicaState, especialidadId?: number): string {
  if (!especialidadId) return "—";
  return state.especialidades.find((e) => e.id === especialidadId)?.nombre ?? "—";
}

function setPacientes(updater: (prev: Paciente[]) => Paciente[]) {
  state = { ...state, pacientes: updater(state.pacientes) };
  emitChange();
}

function correoDisponible(correo: string): boolean {
  const existeUsuario = state.usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase());
  const existePaciente = state.pacientes.some((p) => p.correo.toLowerCase() === correo.toLowerCase());
  return !existeUsuario && !existePaciente;
}

function registrarPaciente(paciente: Omit<Paciente, "id" | "registro">) {
  const nuevo: Paciente = {
    ...paciente,
    id: Date.now(),
    registro: new Date().toLocaleDateString("es-CR"),
  };
  setPacientes((prev) => [...prev, nuevo]);
  return nuevo;
}

function setMedicamentos(updater: (prev: Medicamento[]) => Medicamento[]) {
  state = { ...state, medicamentos: updater(state.medicamentos) };
  emitChange();
}

function crearMedicamento(medicamento: Omit<Medicamento, "id">) {
  const nuevo: Medicamento = { ...medicamento, id: Date.now() };
  setMedicamentos((prev) => [...prev, nuevo]);
  return nuevo;
}

function actualizarMedicamento(medicamento: Medicamento) {
  setMedicamentos((prev) => prev.map((m) => (m.id === medicamento.id ? medicamento : m)));
}

function setRecetas(updater: (prev: Receta[]) => Receta[]) {
  state = { ...state, recetas: updater(state.recetas) };
  emitChange();
}

function validarReceta(id: number, idIngresado: number): boolean {
  if (id !== idIngresado) return false;
  setRecetas((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "Validada" } : r)));
  return true;
}

function marcarRecetaEntregada(id: number) {
  setRecetas((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "Entregada" } : r)));
}

function iniciarSesion(usuario: string, contrasena: string): Credencial | null {
  const encontrado = CREDENCIALES_INICIALES.find(
    (c) => c.usuario.toLowerCase() === usuario.trim().toLowerCase() && c.contrasena === contrasena
  );
  if (!encontrado) return null;
  state = { ...state, usuarioActual: encontrado };
  emitChange();
  return encontrado;
}

function cerrarSesion() {
  state = { ...state, usuarioActual: null };
  emitChange();
}

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
  toggleEstadoEspecialidad,
  eliminarEspecialidad,
  medicosDeEspecialidad,
  nombreEspecialidad,
  correoDisponible,
  registrarPaciente,
  crearMedicamento,
  actualizarMedicamento,
  validarReceta,
  marcarRecetaEntregada,
  iniciarSesion,
  cerrarSesion,
};

export function useClinicaStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}