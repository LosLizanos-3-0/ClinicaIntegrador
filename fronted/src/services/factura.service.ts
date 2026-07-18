import api from "./api";
import type { Factura, MetodoPago } from "../types/clinica.types";

const METODO_A_BD: Record<MetodoPago, string> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  "Sinpe Móvil": "SINPE",
};
const METODO_A_FRONT: Record<string, MetodoPago> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  SINPE: "Sinpe Móvil",
};

interface FacturaBD {
  IdFactura: number;
  IdPaciente: number;
  IdCita: number;
  FechaEmision: string;
  Total: number;
  Estado: "Pendiente" | "Pagada" | "Anulada";
}

export const facturaService = {
  async listar(pacientesMap: Map<number, { nombre: string; cedula: string }>): Promise<Factura[]> {
    const { data } = await api.get<FacturaBD[]>("/facturas");
    const detalles = await Promise.all(data.map((f) => api.get(`/detalle-factura`)));
    // Nota: idealmente el backend debería filtrar por IdFactura; por ahora traemos todo y filtramos en cliente
    const todosDetalles = detalles[0]?.data ?? [];

    return data.map((f) => {
      const paciente = pacientesMap.get(f.IdPaciente);
      const items = todosDetalles
        .filter((d: any) => d.IdFactura === f.IdFactura)
        .map((d: any) => ({ concepto: d.Concepto, cantidad: d.Cantidad, precioUnitario: d.PrecioUnitario }));
      return {
        id: f.IdFactura,
        pacienteId: f.IdPaciente,
        paciente: paciente?.nombre ?? "",
        cedulaPaciente: paciente?.cedula ?? "",
        citaId: f.IdCita,
        fecha: new Date(f.FechaEmision).toLocaleDateString("es-CR"),
        items,
        subtotal: f.Total,
        impuesto: 0,
        total: f.Total,
        estado: f.Estado,
      };
    });
  },

  async crear(datos: {
    IdPaciente: number;
    IdCita: number;
    total: number;
    concepto: string;
    cantidad: number;
    precioUnitario: number;
  }) {
    const { data: facturaRes } = await api.post("/facturas", {
      IdPaciente: datos.IdPaciente,
      IdCita: datos.IdCita,
      Total: datos.total,
      Estado: "Pendiente",
    });
    // El backend no devuelve el Id insertado en este endpoint; ver nota abajo
    const facturas = await api.get<FacturaBD[]>("/facturas");
    const nueva = facturas.data.sort((a, b) => b.IdFactura - a.IdFactura)[0];

    await api.post("/detalle-factura", {
      IdFactura: nueva.IdFactura,
      Concepto: datos.concepto,
      Cantidad: datos.cantidad,
      PrecioUnitario: datos.precioUnitario,
      Subtotal: datos.cantidad * datos.precioUnitario,
    });
  },

  async cambiarEstado(id: number, base: FacturaBD, nuevoEstado: "Pagada" | "Anulada", metodoPago?: MetodoPago) {
    await api.put(`/facturas/${id}`, { ...base, Estado: nuevoEstado });
    if (nuevoEstado === "Pagada" && metodoPago) {
      await api.post("/pagos", {
        IdFactura: id,
        Monto: base.Total,
        MetodoPago: METODO_A_BD[metodoPago],
      });
    }
  },
};