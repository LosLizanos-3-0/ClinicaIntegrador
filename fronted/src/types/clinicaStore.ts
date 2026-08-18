import { useSyncExternalStore } from "react";
import type {
  EstadoUsuario,
  Paciente,
  Medicamento,
  CategoriaMedicamento,
  Receta,
  Cita,
  Factura,
  MetodoPago,
  Credencial,
  ConsultaMedica,
} from "./clinica.types";
import { pacienteService } from "../services/paciente.service";
import { especialidadService } from "../services/especialidad.service";
import { usuarioService, type DatosUsuarioForm } from "../services/usuario.service";
import { rolService, type RolBD } from "../services/rol.service";
import { citaService } from "../services/cita.service";
import { facturaService } from "../services/factura.service";
import { authService } from "../services/auth.service";
import { medicamentoService } from "../services/medicamento.service";
import { categoriaMedicamentoService } from "../services/categoriaMedicamento.service";
import { expedienteService } from "../services/expediente.service";
import { consultaService } from "../services/consulta.service";
import { recetaService } from "../services/receta.service";
import { entregaMedicamentoService } from "../services/entregaMedicamento.service";
import { detalleRecetaService } from "../services/detalleReceta.service";
import { calcularTotalConIva } from "../services/factura.service";

export interface UsuarioClinica {
  id: number;
  nombre: string;
  apellido1: string;
  apellido2?: string;
  telefono?: string;
  correo: string;
  rol: string;
  estado: EstadoUsuario;
  ingreso: string;
  iniciales: string;
  especialidadIds?: number[];
  nombreUsuario: string;
  ident: string;
}

export type EspecialidadClinica = {
  id: number;
  nombre: string;
  icono: string;
  colorFondo: string;
  estado: "Activa" | "Inactiva";
};

interface ClinicaState {
  usuarios: UsuarioClinica[];
  especialidades: EspecialidadClinica[];
  roles: RolBD[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  categoriasMedicamento: CategoriaMedicamento[];
  recetas: Receta[];
  citas: Cita[];
  facturas: Factura[];
  usuarioActual: Credencial | null;
  cargando: boolean;
}

const RECETAS_INICIALES: Receta[] = [];

let state: ClinicaState = {
  usuarios: [],
  especialidades: [],
  roles: [],
  pacientes: [],
  medicamentos: [],
  categoriasMedicamento: [],
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

let yaCargado = false;
async function cargarTodo() {
  if (yaCargado) return;
  yaCargado = true;
  try {
    const [pacientes, especialidades, usuarios, roles, medicamentos, categoriasMedicamento] = await Promise.all([
      pacienteService.listar(),
      especialidadService.listar(),
      usuarioService.listarConEspecialidad(),
      rolService.listar(),
      medicamentoService.listar(),
      categoriaMedicamentoService.listar(),
    ]);
    const citas = await citaService.listar(pacientes, usuarios, especialidades);
    const recetas = await recetaService.listar(pacientes, usuarios, especialidades, medicamentos);
    const pacientesMap = new Map(
      pacientes.map((p) => [p.id, { nombre: `${p.nombre} ${p.apellido1} ${p.apellido2}`, cedula: p.cedula }])
    );
    const facturas = await facturaService.listar(pacientesMap);

    patch({
      pacientes,
      especialidades,
      usuarios,
      roles,
      medicamentos,
      categoriasMedicamento,
      citas,
      recetas,
      facturas,
      cargando: false,
    });
  } catch (error) {
    console.error("Error cargando datos del backend:", error);
    patch({ cargando: false });
  }
}

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
  await pacienteService.cambiarEstado(id, actual.estado);
  const pacientes = await pacienteService.listar();
  patch({ pacientes });
}

function correoDisponible(correo: string): boolean {
  return !state.pacientes.some((p) => p.correo.toLowerCase() === correo.toLowerCase());
}

function medicosActivos(s: ClinicaState): UsuarioClinica[] {
  return s.usuarios.filter((u) => (u.rol === "Medico" || u.rol === "Médico") && u.estado === "Activo");
}

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
  await especialidadService.toggleEstado(id, actual.estado);
  await refrescarEspecialidades();
}

async function refrescarMedicamentos() {
  const medicamentos = await medicamentoService.listar();
  patch({ medicamentos });
}

async function crearMedicamento(datos: Omit<Medicamento, "id" | "estado" | "categoria">) {
  await medicamentoService.crear(datos);
  await refrescarMedicamentos();
}

async function actualizarMedicamento(medicamento: Omit<Medicamento, "estado" | "categoria" | "stockActual">) {
  await medicamentoService.actualizar(medicamento.id, medicamento);
  await refrescarMedicamentos();
}

async function toggleEstadoMedicamento(id: number) {
  const actual = state.medicamentos.find((m) => m.id === id);
  if (!actual) return;
  await medicamentoService.cambiarEstado(id, actual.estado);
  await refrescarMedicamentos();
}

async function actualizarStockMedicamento(id: number, stockActual: number) {
  const rol = state.usuarioActual?.rol;
  if (rol !== "Administrador") return; // el botón ni debería mostrarse, pero por si acaso
  await medicamentoService.actualizarStock(id, stockActual, rol);
  await refrescarMedicamentos();
}

async function refrescarCategoriasMedicamento() {
  const categoriasMedicamento = await categoriaMedicamentoService.listar();
  patch({ categoriasMedicamento });
}

async function crearCategoriaMedicamento(datos: Omit<CategoriaMedicamento, "id" | "estado">) {
  await categoriaMedicamentoService.crear(datos);
  await refrescarCategoriasMedicamento();
}

async function actualizarCategoriaMedicamento(categoria: Omit<CategoriaMedicamento, "estado">) {
  await categoriaMedicamentoService.actualizar(categoria.id, categoria);
  await refrescarCategoriasMedicamento();
}

async function toggleEstadoCategoriaMedicamento(id: number) {
  const actual = state.categoriasMedicamento.find((c) => c.id === id);
  if (!actual) return;
  await categoriaMedicamentoService.cambiarEstado(id, actual.estado);
  await refrescarCategoriasMedicamento();
}

async function refrescarRoles() {
  const roles = await rolService.listar();
  patch({ roles });
}

async function crearRol(nombreRol: string, cita: boolean = false, estado: "A" | "I" = "A") {
  await rolService.crear(nombreRol, cita, estado);
  await refrescarRoles();
}

async function toggleEstadoRol(id: number) {
  const actual = state.roles.find((r) => r.IdRol === id);
  if (!actual) return;
  await rolService.cambiarEstado(id, actual.Estado ?? "A");
  await refrescarRoles();
}

async function actualizarRol(rol: RolBD, cambios: { nombreRol: string; cita: boolean; estado: "A" | "I" }) {
  await rolService.actualizar(rol.IdRol, cambios.nombreRol, cambios.cita);
  if ((rol.Estado ?? "A") !== cambios.estado) {
    await rolService.cambiarEstado(rol.IdRol, rol.Estado ?? "A");
  }
  await refrescarRoles();
}

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
    apellido1: usuario.apellido1,
    apellido2: usuario.apellido2,
    telefono: usuario.telefono,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
    nombreUsuario: usuario.nombreUsuario,
    ident: usuario.ident,
  });
  await refrescarUsuarios();
}

async function toggleEstadoUsuario(id: number) {
  const actual = state.usuarios.find((u) => u.id === id);
  if (!actual) return;
  await usuarioService.cambiarEstado(id, actual.estado);
  await refrescarUsuarios();
}

async function asignarEspecialidadAMedico(usuarioId: number, especialidadId: number) {
  await usuarioService.asignarEspecialidad(usuarioId, especialidadId);
  await refrescarUsuarios();
}

async function quitarEspecialidadDeMedico(usuarioId: number, especialidadId: number) {
  await usuarioService.quitarEspecialidad(usuarioId, especialidadId);
  await refrescarUsuarios();
}

function medicosDeEspecialidad(s: ClinicaState, especialidadId: number): UsuarioClinica[] {
  return s.usuarios.filter((u) => u.rol === "Médico" && (u.especialidadIds ?? []).includes(especialidadId));
}

function nombreEspecialidad(s: ClinicaState, especialidadId?: number): string {
  if (!especialidadId) return "—";
  return s.especialidades.find((e) => e.id === especialidadId)?.nombre ?? "—";
}

async function registrarAtencionMedica(datos: {
  pacienteId: number;
  medicoId: number;
  citaId: number;
  observaciones?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentos: { medicamentoId: number; cantidad: number; indicaciones?: string }[];
}) {
  const idExpediente = await expedienteService.crear({
    IdPaciente: datos.pacienteId,
    IdUsuario: datos.medicoId,
    IdCita: datos.citaId,
    Observaciones: datos.observaciones,
  });

  const idConsulta = await consultaService.crear({
    IdExpediente: idExpediente,
    IdCita: datos.citaId,
    IdUsuario: datos.medicoId,
    Diagnostico: datos.diagnostico,
    Tratamiento: datos.tratamiento,
  });

  if (datos.medicamentos.length > 0) {
    await recetaService.crear({
      IdConsulta: idConsulta,
      IdPaciente: datos.pacienteId,
      IdUsuario: datos.medicoId,
      items: datos.medicamentos.map((m) => ({
        IdMedicamento: m.medicamentoId,
        Cantidad: m.cantidad,
        Indicaciones: m.indicaciones,
      })),
    });
  }

  await refrescarCitas();
  await refrescarRecetas();
}

async function obtenerHistorialPaciente(pacienteId: number): Promise<ConsultaMedica[]> {
  const [expedientes, consultas] = await Promise.all([expedienteService.listar(), consultaService.listar()]);
  const idsExpedientes = new Set(expedientes.filter((e) => e.pacienteId === pacienteId).map((e) => e.id));
  return consultas.filter((c) => idsExpedientes.has(c.expedienteId));
}

// Ahora recibe también especialidadId, requerido por el backend (columna
// IdEspecialidad, obligatoria en InsertCita).
async function crearCita(datos: {
  pacienteId: number;
  especialidadId: number;
  medicoId: number;
  fecha: string;
  hora: string;
  motivo: string;
}) {
  await citaService.crear({
    IdPaciente: datos.pacienteId,
    IdEspecialidad: datos.especialidadId,
    IdUsuario: datos.medicoId,
    FechaCita: datos.fecha,
    HoraCita: datos.hora,
    Motivo: datos.motivo,
  });
  const citas = await citaService.listar(state.pacientes, state.usuarios, state.especialidades);
  patch({ citas });
}

async function refrescarCitas() {
  const citas = await citaService.listar(state.pacientes, state.usuarios, state.especialidades);
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
  await citaService.actualizarEstado(id, estado);
  await refrescarCitas();
}

// Ahora envía también IdEspecialidad al reprogramar (requerido por
// UpdateCita en el backend).
async function actualizarCita(cita: Cita) {
  await citaService.reprogramar(
    cita.id,
    {
      IdCita: cita.id,
      IdPaciente: cita.pacienteId,
      IdEspecialidad: cita.especialidadId,
      IdUsuario: cita.medicoId,
      FechaCita: cita.fecha,
      HoraCita: cita.hora,
      Estado: cita.estado,
      Motivo: cita.motivo,
    },
    {
      FechaCita: cita.fecha,
      HoraCita: cita.hora,
      Motivo: cita.motivo,
      IdUsuario: cita.medicoId,
      IdEspecialidad: cita.especialidadId,
    }
  );
  await refrescarCitas();
}

async function crearFactura(datos: {
  pacienteId: number;
  citaId?: number;
  montoConsulta: number;
  idsDetalleRecetaSeleccionados?: number[]; // items de la receta que el paciente decide pagar aqui
  idReceta?: number;
}) {
  const idFactura = await facturaService.crear({
    IdPaciente: datos.pacienteId,
    IdCita: datos.citaId ?? 0,
    montoConsulta: datos.montoConsulta,
  });

  // Si el paciente eligio medicamentos, se marcan y se agregan a la factura.
  // El precio y el subtotal los calcula la base de datos, no el frontend.
  if (datos.idsDetalleRecetaSeleccionados?.length && datos.idReceta) {
    for (const idDetalleReceta of datos.idsDetalleRecetaSeleccionados) {
      await detalleRecetaService.marcarIncluirFactura(idDetalleReceta, true);
    }
    await facturaService.agregarMedicamentosDeReceta(idFactura, datos.idReceta);
  }

  // Importante: refrescar tambien las recetas, si no el store se queda con
  // "incluirFactura: false" en memoria y el medicamento sigue apareciendo
  // como disponible para cobrar en otra factura del mismo paciente.
  await Promise.all([refrescarFacturas(), refrescarRecetas()]);
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
  // Se cobra el total CON el 13% de IVA (calculado en codigo), aunque la BD
  // solo conoce el monto sin impuesto.
  const montoConIva = calcularTotalConIva(factura.total);
  await facturaService.cambiarEstado(id, "Pagada", montoConIva, metodoPago);
  await refrescarFacturas();
}

async function anularFactura(id: number) {
  await facturaService.cambiarEstado(id, "Anulada");
  await refrescarFacturas();
}
// ─────────────────────────────────────────────
// Recetas (farmacéutico — gestión de entregas)
// ─────────────────────────────────────────────

async function refrescarRecetas() {
  const recetas = await recetaService.listar(state.pacientes, state.usuarios, state.especialidades, state.medicamentos);
  patch({ recetas });
}

function validarNumeroReceta(idReceta: number, idIngresado: number): boolean {
  return idReceta === idIngresado;
}

async function marcarRecetaEntregada(idReceta: number, idUsuarioFarmaceutico: number) {
  await entregaMedicamentoService.crear({ IdReceta: idReceta, IdUsuario: idUsuarioFarmaceutico });
  await recetaService.camEstado(idReceta, "Despachada");
  await refrescarRecetas();
}

async function iniciarSesion(usuario: string, contrasena: string): Promise<Credencial | null> {
  try {
    const credencial = await authService.login(usuario, contrasena);
    patch({ usuarioActual: credencial });
    return credencial;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return null;
  }
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

  crearMedicamento,
  actualizarMedicamento,
  toggleEstadoMedicamento,
  refrescarMedicamentos,
  actualizarStockMedicamento,
  refrescarCategoriasMedicamento,
  crearCategoriaMedicamento,
  actualizarCategoriaMedicamento,
  toggleEstadoCategoriaMedicamento,

  crearRol,
  actualizarRol,
  toggleEstadoRol,

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

  registrarAtencionMedica,
  obtenerHistorialPaciente,

  refrescarRecetas,
  validarNumeroReceta,
  marcarRecetaEntregada,
};

export function useClinicaStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snap;
}