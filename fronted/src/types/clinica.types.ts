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

// Codigo, medicos, consultorios y tags NO existen en la tabla Especialidad
// de la base de datos (ver especialidad.model.ts: solo IdEspecialidad,
// Estado, NombreEspecialidad). Se eliminaron del tipo para reflejar
// exactamente lo que el sistema realmente persiste.
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
}

// Ajustado a las columnas reales de la tabla Medicamento en SQL Server:
// IdMedicamento, NombreMedicamento, Descripcion, Presentacion, Ubicacion,
// StockActual, StockMinimo, PrecioUnitario, Estado. No existen Unidad,
// Laboratorio ni Categoría en la base de datos.
export interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  estado: "A" | "I";
}

export type EstadoCita = "Programada" | "Confirmada" | "Atendida" | "Cancelada";

export interface Cita {
  id: number;
  pacienteId: number;
  paciente: string;
  cedulaPaciente: string;
  medicoId: number;
  medico: string;
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
  items: ItemFactura[];
  subtotal: number;
  impuesto: number;
  total: number;
  estado: EstadoFactura;
  metodoPago?: MetodoPago;
}

export type EstadoReceta = "Pendiente" | "Validada" | "Entregada";

export interface ItemReceta {
  medicamentoId: number;
  medicamento: string;
  cantidad: number;
  indicaciones: string;
}

export interface Receta {
  id: number;
  paciente: string;
  cedulaPaciente: string;
  medico: string;
  especialidad: string;
  fecha: string;
  items: ItemReceta[];
  estado: EstadoReceta;
  observaciones?: string;
}