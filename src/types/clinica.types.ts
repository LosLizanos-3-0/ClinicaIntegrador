// ─── Tipos compartidos del sistema de clínica ────────────────────────────────

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

// ─── Reportes (RF09) ──────────────────────────────────────────────────────────
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

// ─── Especialidades (RF03) ────────────────────────────────────────────────────
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

// ─── Roles y permisos (RF08) ──────────────────────────────────────────────────
export interface Rol {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  usuarios: number;
  esSistema: boolean;
}

export type MatrizPermisos = Record<number, Record<string, Record<string, boolean>>>;