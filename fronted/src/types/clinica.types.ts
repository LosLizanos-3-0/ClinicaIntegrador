export type EstadoUsuario = "Activo" | "Inactivo";

export type RolUsuario = string;

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  ingreso: string;
  iniciales: string;
}

export type TipoReporte = "Consultas" | "Finanzas" | "Personal" | "Pacientes" | "Auditoría";

export interface KPI {
  label: string;
  valor: string;
  delta: string;
  positivo: boolean;
  icono: string;
  colorClase: string;
}

export interface BarraEspecialidad {
  nombre: string;
  valor: number;
  max: number;
  colorClase: string;
}

export interface Reporte {
  id: number;
  nombre: string;
  fecha: string;
  autor: string;
  tipo: TipoReporte;
  colorClase: string;
}

export type EstadoEspecialidad = "Activa" | "Inactiva";

export interface Especialidad {
  id: number;
  nombre: string;
  icono: string;
  colorFondo: string;
  estado: EstadoEspecialidad;
}

export interface Rol {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  usuarios: number;
  esSistema: boolean;
}

export type MatrizPermisos = Record<number, Record<string, Record<string, boolean>>>;

export interface Credencial {
  usuario: string;
  contrasena: string;
  rol: RolUsuario;
  nombreCompleto: string;
  iniciales: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido1: string;
  apellido2: string;
  cedula: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  registro: string;
  estado: EstadoUsuario;
  sexo: "Masculino" | "Femenino";
  direccion?: string;
}

export interface CategoriaMedicamento {
  id: number;
  nombre: string;
  comentario?: string;
  estado: "A" | "I";
}

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  idCategoria: number;
  categoria?: string;
  presentacion?: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  estado: "A" | "I";
}

export interface RegistroBitacora {
  id: number;
  tabla: string;
  accion: string;
  fecha: string;
  usuarioSql: string;
  registro: string;
}

export type EstadoCita = "Programada" | "Confirmada" | "Atendida" | "Cancelada";

// Se agregó especialidadId: ahora la cita guarda explícitamente con qué
// especialidad fue agendada (columna real IdEspecialidad en la BD), en
// vez de derivarla del médico — necesario porque un médico puede tener
// varias especialidades.
export interface Cita {
  id: number;
  pacienteId: number;
  paciente: string;
  cedulaPaciente: string;
  medicoId: number;
  medico: string;
  especialidadId: number;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  notas?: string;
}

export type EstadoFactura = "Pendiente" | "Pagada" | "Anulada";

export type MetodoPago = "Efectivo" | "Tarjeta" | "Sinpe Móvil" | "Transferencia";

export interface ItemFactura {
  idDetalleFactura?: number;
  idDetalleReceta?: number;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Factura {
  id: number;
  pacienteId: number;
  paciente: string;
  cedulaPaciente: string;
  citaId?: number;
  fecha: string;
  items: ItemFactura[]; // solo los medicamentos facturados
  montoConsulta: number;
  montoReceta: number;
  total: number;
  estado: EstadoFactura;
  metodoPago?: MetodoPago;
}

export type EstadoReceta = "Pendiente" | "Despachada" | "Anulada";

export interface ItemReceta {
  idDetalleReceta: number;
  medicamentoId: number;
  medicamento: string;
  cantidad: number;
  precioUnitario: number;
  indicaciones: string;
  incluirFactura: boolean; // el paciente eligio comprarlo aqui
}

export interface Receta {
  id: number;
  pacienteId: number;
  citaId?: number; // de que cita/consulta viene esta receta, para no mezclarla con otras citas del mismo paciente
  paciente: string;
  cedulaPaciente: string;
  medico: string;
  especialidad: string;
  fecha: string;
  items: ItemReceta[];
  estado: EstadoReceta;
  observaciones?: string;
}

export interface ExpedienteMedico {
  id: number;
  pacienteId: number;
  medicoId: number;
  citaId: number;
  fecha: string;
  observaciones?: string;
}

export interface ConsultaMedica {
  id: number;
  expedienteId: number;
  citaId?: number;
  medicoId: number;
  fecha: string;
  diagnostico?: string;
  tratamiento?: string;
}