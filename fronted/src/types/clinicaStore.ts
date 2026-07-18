import { useSyncExternalStore } from "react";
import type {
  EstadoUsuario,
  Paciente,
  Medicamento,
  Receta,
  Cita,
  Factura,
  MetodoPago,
  Credencial,
} from "./clinica.types";
import { pacienteService } from "../services/paciente.service";
import { especialidadService } from "../services/especialidad.service";
import { usuarioService, type DatosUsuarioForm } from "../services/usuario.service";
import { citaService } from "../services/cita.service";
import { facturaService } from "../services/factura.service";

export interface UsuarioClinica {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  estado: EstadoUsuario;
  ingreso: string;
  iniciales: string;
  especialidadId?: number;
  nombreUsuario: string;
  ident: string;
}

export type EspecialidadClinica = {
  id: number;
  nombre: string;
  codigo: string;
  icono: string;
  colorFondo: string;
  estado: "Activa" | "Inactiva";
  medicos: number;
  consultorios: number;
  tags: string[];
};

interface ClinicaState {
  usuarios: UsuarioClinica[];
  especialidades: EspecialidadClinica[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  recetas: Receta[];
  citas: Cita[];
  facturas: Factura[];
  usuarioActual: Credencial | null;
  cargando: boolean;
}

// Medicamentos y recetas siguen mock por ahora — no conectados aún al backend
const MEDICAMENTOS_INICIALES: Medicamento[] = [];
const RECETAS_INICIALES: Receta[] = [];

const CREDENCIALES_INICIALES: Credencial[] = [
  { usuario: "admin",         contrasena: "123", rol: "Administrador", nombreCompleto: "Andrea Salas",       iniciales: "AS" },
  { usuario: "medico",        contrasena: "123", rol: "Médico",        nombreCompleto: "Dr. Rafael Morales", iniciales: "RM" },
  { usuario: "recepcionista", contrasena: "123", rol: "Recepcionista", nombreCompleto: "Lucía Vargas",       iniciales: "LV" },
  { usuario: "farmaceutico",  contrasena: "123", rol: "Farmacéutico",  nombreCompleto: "Carlos Ramírez",     iniciales: "CR" },
];

let state: ClinicaState = {
  usuarios: [],
  especialidades: [],
  pacientes: [],
  medicamentos: MEDICAMENTOS_INICIALES,
  recetas: RECETAS_INICIALES,
  citas: [],
  facturas: [],
  usuarioActual: null,
  cargando: true,
};

const listeners = new Set<() => void>();
function emitChange() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): ClinicaState {
  return state;
}
function patch(partial: Partial<ClinicaState>) {
  state = { ...state, ...partial };
  emitChange();
}

// ─── Carga inicial desde el backend ────────────────────────────────────────
let yaCargado = false;
async function cargarTodo() {
  if (yaCargado) return;
  yaCargado = true;
  try {
    const [pacientes, especialidades, usuarios] = await Promise.all([
      pacienteService.listar(),
      especialidadService.listar(),
      usuarioService.listarConEspecialidad(),
    ]);
    const citas = await citaService.listar(pacientes, usuarios);
    const pacientesMap = new Map(
      pacientes.map((p) => [p.id, { nombre: `${p.nombre} ${p.apellido1} ${p.apellido2}`, cedula: p.cedula }])
    );
    const facturas = await facturaService.listar(pacientesMap);

    patch({ pacientes, especialidades, usuarios, citas, facturas, cargando: false });
  } catch (error) {
    console.error("Error cargando datos del backend:", error);
    patch({ cargando: false });
  }
}

// ─── Pacientes ──────────────────────────────────────────────────────────────
async function registrarPaciente(datos: Omit<Paciente, "id" | "registro">) {
  await pacienteService.crear(datos);
  const pacientes = await pacienteService.listar();
  patch({ pacientes });
}

async function actualizarPaciente(paciente: Paciente) {
  await pacienteService.actualizar(paciente.id, paciente);
  const pacientes = await pacienteService.listar();
  patch({ pacientes });
}

async function toggleEstadoPaciente(id: number) {
  const actual = state.pacientes.find((p) => p.id === id);
  if (!actual) return;
  await pacienteService.cambiarEstado(id, actual);
  const pacientes = await pacienteService.listar();
  patch({ pacientes });
}

function correoDisponible(correo: string): boolean {
  return !state.pacientes.some((p) => p.correo.toLowerCase() === correo.toLowerCase());
}

function medicosActivos(s: ClinicaState): UsuarioClinica[] {
  return s.usuarios.filter((u) => (u.rol === "Medico" || u.rol === "Médico") && u.estado === "Activo");
}

// ─── Especialidades ─────────────────────────────────────────────────────────
async function refrescarEspecialidades() {
  const especialidades = await especialidadService.listar();
  patch({ especialidades });
}

async function crearEspecialidad(datos: { nombre: string }) {
  await especialidadService.crear(datos.nombre);
  await refrescarEspecialidades();
}

async function actualizarEspecialidad(especialidad: EspecialidadClinica) {
  await especialidadService.actualizar(especialidad.id, especialidad.nombre, especialidad.estado);
  await refrescarEspecialidades();
}

async function toggleEstadoEspecialidad(id: number) {
  const actual = state.especialidades.find((e) => e.id === id);
  if (!actual) return;
  await especialidadService.toggleEstado(id, actual.estado, actual.nombre);
  await refrescarEspecialidades();
}

// ─── Usuarios ───────────────────────────────────────────────────────────────
async function refrescarUsuarios() {
  const usuarios = await usuarioService.listarConEspecialidad();
  patch({ usuarios });
}

async function crearUsuario(datos: DatosUsuarioForm & { contrasena: string }) {
  await usuarioService.crear(datos);
  await refrescarUsuarios();
}

async function actualizarUsuario(usuario: UsuarioClinica) {
  await usuarioService.actualizar(usuario.id, {
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
    especialidadId: usuario.especialidadId,
    nombreUsuario: usuario.nombreUsuario,
    ident: usuario.ident,
  });
  await refrescarUsuarios();
}

async function toggleEstadoUsuario(id: number) {
  const actual = state.usuarios.find((u) => u.id === id);
  if (!actual) return;
  await usuarioService.cambiarEstado(id, {
    nombre: actual.nombre,
    correo: actual.correo,
    rol: actual.rol,
    estado: actual.estado,
    especialidadId: actual.especialidadId,
    nombreUsuario: actual.nombreUsuario,
    ident: actual.ident,
  });
  await refrescarUsuarios();
}

async function asignarEspecialidadAMedico(usuarioId: number, especialidadId: number) {
  await usuarioService.asignarEspecialidad(usuarioId, especialidadId);
  await refrescarUsuarios();
}

async function quitarEspecialidadDeMedico(usuarioId: number) {
  await usuarioService.quitarEspecialidad(usuarioId);
  await refrescarUsuarios();
}

function medicosDeEspecialidad(s: ClinicaState, especialidadId: number): UsuarioClinica[] {
  return s.usuarios.filter((u) => u.rol === "Médico" && u.especialidadId === especialidadId);
}

function nombreEspecialidad(s: ClinicaState, especialidadId?: number): string {
  if (!especialidadId) return "—";
  return s.especialidades.find((e) => e.id === especialidadId)?.nombre ?? "—";
}

// ─── Citas ──────────────────────────────────────────────────────────────────
async function crearCita(datos: { pacienteId: number; medicoId: number; fecha: string; hora: string; motivo: string }) {
  await citaService.crear({
    IdPaciente: datos.pacienteId,
    IdUsuario: datos.medicoId,
    FechaCita: datos.fecha,
    HoraCita: datos.hora,
    Motivo: datos.motivo,
  });
  const citas = await citaService.listar(state.pacientes, state.usuarios);
  patch({ citas });
}

async function refrescarCitas() {
  const citas = await citaService.listar(state.pacientes, state.usuarios);
  patch({ citas });
}

async function confirmarCita(id: number) {
  await cambiarEstadoCita(id, "Confirmada");
}
async function cancelarCita(id: number) {
  await cambiarEstadoCita(id, "Cancelada");
}
async function marcarCitaAtendida(id: number) {
  await cambiarEstadoCita(id, "Atendida");
}
async function cambiarEstadoCita(id: number, estado: string) {
  const cita = state.citas.find((c) => c.id === id);
  if (!cita) return;
  await citaService.actualizarEstado(
    id,
    {
      IdCita: id,
      IdPaciente: cita.pacienteId,
      IdUsuario: cita.medicoId,
      FechaCita: cita.fecha,
      HoraCita: cita.hora,
      Estado: cita.estado,
      Motivo: cita.motivo,
    },
    estado
  );
  await refrescarCitas();
}

async function actualizarCita(cita: Cita) {
  await citaService.reprogramar(
    cita.id,
    {
      IdCita: cita.id,
      IdPaciente: cita.pacienteId,
      IdUsuario: cita.medicoId,
      FechaCita: cita.fecha,
      HoraCita: cita.hora,
      Estado: cita.estado,
      Motivo: cita.motivo,
    },
    { FechaCita: cita.fecha, HoraCita: cita.hora, Motivo: cita.motivo, IdUsuario: cita.medicoId }
  );
  await refrescarCitas();
}

// ─── Facturas ─────────────────────────────────────────────────────────────
async function crearFactura(datos: {
  pacienteId: number;
  citaId?: number;
  items: { concepto: string; cantidad: number; precioUnitario: number }[];
}) {
  const item = datos.items[0];
  const total = item.cantidad * item.precioUnitario;
  await facturaService.crear({
    IdPaciente: datos.pacienteId,
    IdCita: datos.citaId ?? 0,
    total,
    concepto: item.concepto,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
  });
  await refrescarFacturas();
}

async function refrescarFacturas() {
  const pacientesMap = new Map(
    state.pacientes.map((p) => [p.id, { nombre: `${p.nombre} ${p.apellido1} ${p.apellido2}`, cedula: p.cedula }])
  );
  const facturas = await facturaService.listar(pacientesMap);
  patch({ facturas });
}

async function marcarFacturaPagada(id: number, metodoPago: MetodoPago) {
  const factura = state.facturas.find((f) => f.id === id);
  if (!factura) return;
  await facturaService.cambiarEstado(
    id,
    {
      IdFactura: id,
      IdPaciente: factura.pacienteId,
      IdCita: factura.citaId ?? 0,
      FechaEmision: factura.fecha,
      Total: factura.total,
      Estado: factura.estado,
    },
    "Pagada",
    metodoPago
  );
  await refrescarFacturas();
}

async function anularFactura(id: number) {
  const factura = state.facturas.find((f) => f.id === id);
  if (!factura) return;
  await facturaService.cambiarEstado(
    id,
    {
      IdFactura: id,
      IdPaciente: factura.pacienteId,
      IdCita: factura.citaId ?? 0,
      FechaEmision: factura.fecha,
      Total: factura.total,
      Estado: factura.estado,
    },
    "Anulada"
  );
  await refrescarFacturas();
}

// ─── Sesión (se mantiene mock por ahora) ───────────────────────────────────
function iniciarSesion(usuario: string, contrasena: string): Credencial | null {
  const encontrado = CREDENCIALES_INICIALES.find(
    (c) => c.usuario.toLowerCase() === usuario.trim().toLowerCase() && c.contrasena === contrasena
  );
  if (!encontrado) return null;
  patch({ usuarioActual: encontrado });
  return encontrado;
}
function cerrarSesion() {
  patch({ usuarioActual: null });
}

export const clinicaStore = {
  subscribe,
  getSnapshot,
  cargarTodo,

  registrarPaciente,
  actualizarPaciente,
  toggleEstadoPaciente,
  correoDisponible,
  medicosActivos,

  crearEspecialidad,
  actualizarEspecialidad,
  toggleEstadoEspecialidad,

  crearUsuario,
  actualizarUsuario,
  toggleEstadoUsuario,
  asignarEspecialidadAMedico,
  quitarEspecialidadDeMedico,
  medicosDeEspecialidad,
  nombreEspecialidad,

  crearCita,
  actualizarCita,
  confirmarCita,
  cancelarCita,
  marcarCitaAtendida,

  crearFactura,
  marcarFacturaPagada,
  anularFactura,

  iniciarSesion,
  cerrarSesion,
};

export function useClinicaStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snap;
}