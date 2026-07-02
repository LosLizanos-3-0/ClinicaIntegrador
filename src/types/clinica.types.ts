export type EstadoUsuario = "Activo" | "Inactivo";

export type RolUsuario =
  | "Administrador"
  | "Médico"
  | "Enfermera"
  | "Recepcionista"
  | "Farmacéutico";

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
  codigo: string;
  icono: string;
  colorFondo: string;
  estado: EstadoEspecialidad;
  medicos: number;
  consultorios: number;
  tags: string[];
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
  contrasena: string;
  registro: string;
}

export type CategoriaMedicamento =
  | "Analgésico"
  | "Antibiótico"
  | "Antiinflamatorio"
  | "Antialérgico"
  | "Antihipertensivo"
  | "Vitaminas"
  | "Otro";

export interface Medicamento {
  id: number;
  nombre: string;
  presentacion: string;
  unidad: string;
  laboratorio: string;
  categoria: CategoriaMedicamento;
  stock: number;
  stockMinimo: number;
  precio: number;
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