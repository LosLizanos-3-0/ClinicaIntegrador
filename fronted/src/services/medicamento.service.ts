import api from "./api";
import type { Medicamento } from "../types/clinica.types";

interface MedicamentoBD {
  IdMedicamento: number;
  NombreMedicamento: string;
  Descripcion: string | null;
  IdCategoria: number;
  NombreCategoria: string | null;
  Presentacion: string | null;
  Ubicacion: string;
  StockActual: number;
  StockMinimo: number;
  PrecioUnitario: number;
  Estado: "A" | "I";
}

function aFrontend(m: MedicamentoBD): Medicamento {
  return {
    id: m.IdMedicamento,
    nombre: m.NombreMedicamento,
    descripcion: m.Descripcion ?? undefined,
    idCategoria: m.IdCategoria,
    categoria: m.NombreCategoria ?? undefined,
    presentacion: m.Presentacion ?? undefined,
    ubicacion: m.Ubicacion,
    stockActual: m.StockActual,
    stockMinimo: m.StockMinimo,
    precioUnitario: m.PrecioUnitario,
    estado: m.Estado,
  };
}

function aBackendCrear(m: Omit<Medicamento, "id" | "estado" | "categoria">) {
  return {
    NombreMedicamento: m.nombre,
    Descripcion: m.descripcion || null,
    IdCategoria: m.idCategoria,
    Presentacion: m.presentacion || null,
    Ubicacion: m.ubicacion,
    StockActual: m.stockActual,
    StockMinimo: m.stockMinimo,
    PrecioUnitario: m.precioUnitario,
  };
}

function aBackendActualizar(m: Omit<Medicamento, "id" | "estado" | "categoria" | "stockActual">) {
  return {
    NombreMedicamento: m.nombre,
    Descripcion: m.descripcion || null,
    IdCategoria: m.idCategoria,
    Presentacion: m.presentacion || null,
    Ubicacion: m.ubicacion,
    StockMinimo: m.stockMinimo,
    PrecioUnitario: m.precioUnitario,
  };
}

export const medicamentoService = {
  async listar(): Promise<Medicamento[]> {
    const { data } = await api.get<MedicamentoBD[]>("/medicamentos");
    return data.map(aFrontend);
  },

  async crear(m: Omit<Medicamento, "id" | "estado" | "categoria">) {
    await api.post("/medicamentos", aBackendCrear(m));
  },

  async actualizar(id: number, m: Omit<Medicamento, "id" | "estado" | "categoria" | "stockActual">) {
    await api.put(`/medicamentos/${id}`, aBackendActualizar(m));
  },

  async cambiarEstado(id: number, estadoActual: "A" | "I") {
    await api.patch(`/medicamentos/${id}/estado`, {
      Estado: estadoActual === "A" ? "I" : "A",
    });
  },

  async actualizarStock(id: number, stockActual: number, rol: string) {
    await api.patch(
      `/medicamentos/${id}/stock`,
      { StockActual: stockActual },
      { headers: { 'x-rol': rol } }
    );
  },
};
