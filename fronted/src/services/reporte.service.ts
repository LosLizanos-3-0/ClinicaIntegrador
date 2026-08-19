import api from "./api";

export interface DashboardData {
  kpis: {
    CitasHoy: number;
    IngresosMes: number;
    PacientesRegistrados: number;
    MedicamentosStockBajo: number;
  };
  consultasPorEspecialidad: { Especialidad: string; Cantidad: number }[];
  estadoCitas: { Estado: string; Cantidad: number }[];
}

export interface CitaReporte {
  IdCita: number;
  FechaCita: string;
  HoraCita: string;
  Estado: string;
  Especialidad: string;
  Paciente: string;
  Medico: string;
}

export interface MedicamentoReporte {
  IdMedicamento: number;
  NombreMedicamento: string;
  Presentacion: string | null;
  Ubicacion: string;
  StockActual: number;
  StockMinimo: number;
  PrecioUnitario: number;
  Categoria: string;
}

export interface FacturaReporte {
  IdFactura: number;
  FechaEmision: string;
  MontoConsulta: number;
  MontoReceta: number;
  Total: number;
  Estado: string;
  Especialidad?: string;
  Paciente: string;
}

export interface PacienteReporte {
  IdPaciente: number;
  Nombre: string;
  Apellido1: string;
  Apellido2: string | null;
  Cedula: string;
  Telefono: string | null;
  Correo: string | null;
  FechaRegistro: string;
}

export const reporteService = {
  async dashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>("/reportes/dashboard");
    return data;
  },
  async citasRango(desde: string, hasta: string): Promise<CitaReporte[]> {
    const { data } = await api.get<CitaReporte[]>("/reportes/citas/rango", { params: { desde, hasta } });
    return data;
  },
  async citasEspecialidad(desde: string, hasta: string, idEspecialidad: number): Promise<CitaReporte[]> {
    const { data } = await api.get<CitaReporte[]>("/reportes/citas/especialidad", { params: { desde, hasta, idEspecialidad } });
    return data;
  },
  async medicamentosCategoria(idCategoria: number): Promise<MedicamentoReporte[]> {
    const { data } = await api.get<MedicamentoReporte[]>("/reportes/inventario/categoria", { params: { idCategoria } });
    return data;
  },
  async ingresosRango(desde: string, hasta: string): Promise<FacturaReporte[]> {
    const { data } = await api.get<FacturaReporte[]>("/reportes/facturacion/ingresos", { params: { desde, hasta } });
    return data;
  },
  async facturacionEspecialidad(desde: string, hasta: string, idEspecialidad: number): Promise<FacturaReporte[]> {
    const { data } = await api.get<FacturaReporte[]>("/reportes/facturacion/especialidad", { params: { desde, hasta, idEspecialidad } });
    return data;
  },
  async pacientesNuevos(desde: string, hasta: string): Promise<PacienteReporte[]> {
    const { data } = await api.get<PacienteReporte[]>("/reportes/pacientes/nuevos", { params: { desde, hasta } });
    return data;
  },
};