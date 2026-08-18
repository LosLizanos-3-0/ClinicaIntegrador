export interface Rol {
  IdRol?: number;
  cita: boolean;
  NombreRol: string;
  Estado?: 'A' | 'I';
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
  IdEspecialidad: number;
  IdUsuario: number;
  FechaCita: string;
  HoraCita: string;
  Estado?: 'Agendada' | 'Confirmada' | 'Cancelada' | 'Reprogramada' | 'Atendida';
  Motivo?: string;
}

export interface ExpedienteMedico {
  IdExpediente?: number;
  IdPaciente: number;
  IdUsuario: number;
  IdCita: number; // 👈 nuevo
  Observaciones?: string;
  Estado?: 'A' | 'I';
}

export interface Consulta {
  IdConsulta?: number;
  IdExpediente: number;
  IdCita?: number;
  IdUsuario: number;
  Diagnostico?: string;
  Tratamiento?: string;
  Estado?: 'A' | 'I';
}

export interface Medicamento {
  IdMedicamento?: number;
  NombreMedicamento: string;
  Descripcion?: string;
  IdCategoria: number;
  Presentacion?: string;
  Ubicacion: string;
  StockActual?: number;
  StockMinimo?: number;
  PrecioUnitario?: number;
  Estado?: 'A' | 'I';
}

// Datos que acepta UpdateMedicamento (no incluye StockActual: ese campo
// solo se modifica mediante el endpoint/procedimiento exclusivo de Admin,
// UpdateStockMedicamento).
export interface MedicamentoUpdate {
  NombreMedicamento: string;
  Descripcion?: string;
  IdCategoria: number;
  Presentacion?: string;
  Ubicacion: string;
  StockMinimo: number;
  PrecioUnitario: number;
  Estado?: 'A' | 'I';
}

export interface CategoriaMedicamento {
  IdCategoria?: number;
  NombreCategoria: string;
  Comentario?: string;
  Estado?: 'A' | 'I';
}

export interface Bitacora {
  IdBita?: number;
  Tabla: string;
  Accion: string;
  Fecha?: string;
  UsuarioSQL?: string;
  Registro?: string;
}

export interface Receta {
  IdReceta?: number;
  IdConsulta: number;
  IdPaciente: number;
  IdUsuario: number;
  Estado?: 'Pendiente' | 'Despachada' | 'Anulada';
}

export interface DetalleReceta {
  IdDetalleReceta?: number;
  IdReceta: number;
  IdMedicamento: number;
  Cantidad: number;
  Indicaciones?: string;
  IncluirFactura?: boolean; // el paciente decide si compra este medicamento aqui
  Estado?: 'A' | 'I';
}

export interface EntregaMedicamento {
  IdEntrega?: number;
  IdReceta: number;
  IdUsuario: number;
  Estado?: 'A' | 'I';
}
export interface Factura {
  IdFactura?: number;
  IdPaciente: number;
  IdCita: number;
  MontoConsulta?: number; // se digita desde el frontend
  MontoReceta?: number;   // se calcula solo, nunca se envia desde el frontend
  Total?: number;         // solo lectura, calculado en la BD (MontoConsulta + MontoReceta)
  Estado?: 'Pendiente' | 'Pagada' | 'Anulada';
}

export interface DetalleFactura {
  IdDetalleFactura?: number;
  IdFactura: number;
  IdDetalleReceta?: number; // enlaza con el medicamento recetado que origino esta linea
  Concepto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal?: number; // solo lectura, calculado en la BD (Cantidad * PrecioUnitario)
  Estado?: 'A' | 'I';
}
export interface Pago {
  IdPago?: number;
  IdFactura: number;
  Monto: number;
  MetodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'SINPE';
  Estado?: 'A' | 'I';
}