export interface Rol {
  IdRol?: number;
  cita: boolean;
  NombreRol: string;
}

export interface Usuario {
  IdUsuario?: number;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  Ident: string;
  Telefono?: string;
  Correo: string;
  NombreUsuario: string;
  Contrasena: string;
  Estado?: 'A' | 'I';
  IdRol: number;
}

export interface Especialidad {
  IdEspecialidad?: number;
  Estado: 'A' | 'I';
  NombreEspecialidad: string;
}

export interface UsuarioEspecialidad {
  IdUsuario: number;
  IdEspecialidad: number;
}

export interface Paciente {
  IdPaciente?: number;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  Cedula: string;
  FechaNacimiento: string;
  Estado?: 'A' | 'I';
  Sexo: 'Masculino' | 'Femenino';
  Telefono?: string;
  Correo?: string;
  Direccion?: string;
}

export interface Cita {
  IdCita?: number;
  IdPaciente: number;
  IdUsuario: number;
  FechaCita: string;
  HoraCita: string;
  Estado?: 'Agendada' | 'Cancelada' | 'Reprogramada' | 'Atendida';
  Motivo?: string;
}

export interface ExpedienteMedico {
  IdExpediente?: number;
  IdPaciente: number;
  IdUsuario: number;
  Observaciones?: string;
}

export interface Consulta {
  IdConsulta?: number;
  IdExpediente: number;
  IdCita?: number;
  IdUsuario: number;
  Diagnostico?: string;
  Tratamiento?: string;
}

export interface Medicamento {
  IdMedicamento?: number;
  NombreMedicamento: string;
  Descripcion?: string;
  Presentacion?: string;
  Ubicacion: string;
  StockActual?: number;
  StockMinimo?: number;
  PrecioUnitario?: number;
}

export interface Receta {
  IdReceta?: number;
  IdConsulta: number;
  IdPaciente: number;
  IdUsuario: number;
  Estado?: 'Pendiente' | 'Despachada';
}

export interface DetalleReceta {
  IdDetalleReceta?: number;
  IdReceta: number;
  IdMedicamento: number;
  Cantidad: number;
  Indicaciones?: string;
}

export interface EntregaMedicamento {
  IdEntrega?: number;
  IdReceta: number;
  IdUsuario: number;
}

export interface Factura {
  IdFactura?: number;
  IdPaciente: number;
  IdCita: number;
  Total?: number;
  Estado?: 'Pendiente' | 'Pagada' | 'Anulada';
}

export interface DetalleFactura {
  IdDetalleFactura?: number;
  IdFactura: number;
  Concepto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
}

export interface Pago {
  IdPago?: number;
  IdFactura: number;
  Monto: number;
  MetodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'SINPE';
}