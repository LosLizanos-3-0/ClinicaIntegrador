import api from "./api";
import type { Medicamento } from "../types/clinica.types";

interface MedicamentoBD {
  IdMedicamento: number;
  NombreMedicamento: string;
  Descripcion: string | null;
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
    presentacion: m.Presentacion ?? undefined,
    ubicacion: m.Ubicacion,
    stockActual: m.StockActual,
    stockMinimo: m.StockMinimo,
    precioUnitario: m.PrecioUnitario,
    estado: m.Estado,
  };
}

function aBackend(m: Omit<Medicamento, "id" | "estado">) {
  return {
    NombreMedicamento: m.nombre,
    Descripcion: m.descripcion || null,
    Presentacion: m.presentacion || null,
    Ubicacion: m.ubicacion,
    StockActual: m.stockActual,
    StockMinimo: m.stockMinimo,
    PrecioUnitario: m.precioUnitario,
  };
}

export const medicamentoService = {
  async listar(): Promise<Medicamento[]> {
    const { data } = await api.get<MedicamentoBD[]>("/medicamentos");
    return data.map(aFrontend);
  },

  async crear(m: Omit<Medicamento, "id" | "estado">) {
    await api.post("/medicamentos", aBackend(m));
  },

  async actualizar(id: number, m: Omit<Medicamento, "id" | "estado">) {
    await api.put(`/medicamentos/${id}`, aBackend(m));
  },

  async cambiarEstado(id: number, estadoActual: "A" | "I") {
    await api.patch(`/medicamentos/${id}/estado`, {
      Estado: estadoActual === "A" ? "I" : "A",
    });
  },
};