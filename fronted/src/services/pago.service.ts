import api from "./api";

export interface PagoBD {
  IdPago: number;
  IdFactura: number;
  FechaPago: string;
  Monto: number;
  MetodoPago: "Efectivo" | "Tarjeta" | "Transferencia" | "SINPE";
  Estado: "A" | "I";
}

export const pagoService = {
  async listar(): Promise<PagoBD[]> {
    const { data } = await api.get<PagoBD[]>("/pagos");
    return data;
  },

  async listarPorFactura(idFactura: number): Promise<PagoBD[]> {
    const todos = await this.listar();
    return todos.filter((p) => p.IdFactura === idFactura);
  },

  async crear(datos: {
    IdFactura: number;
    Monto: number;
    MetodoPago: "Efectivo" | "Tarjeta" | "Transferencia" | "SINPE";
  }): Promise<void> {
    await api.post("/pagos", datos);
  },

  async camEstado(idPago: number, estado: "A" | "I"): Promise<void> {
    await api.patch(`/pagos/${idPago}/estado`, { Estado: estado });
  },
};