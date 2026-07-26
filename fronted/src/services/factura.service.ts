import api from "./api";
import type { Factura, MetodoPago } from "../types/clinica.types";

const METODO_A_BD: Record<MetodoPago, string> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  "Sinpe Móvil": "SINPE",
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
    const { data: todosDetalles } = await api.get<any[]>("/detalle-factura");

    return data.map((f) => {
      const paciente = pacientesMap.get(f.IdPaciente);
      const items = todosDetalles
        .filter((d) => d.IdFactura === f.IdFactura)
        .map((d) => ({ concepto: d.Concepto, cantidad: d.Cantidad, precioUnitario: d.PrecioUnitario }));
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
    await api.post("/facturas", {
      IdPaciente: datos.IdPaciente,
      IdCita: datos.IdCita,
      Total: datos.total,
      Estado: "Pendiente",
    });
    const { data: facturas } = await api.get<FacturaBD[]>("/facturas");
    const nueva = facturas.sort((a, b) => b.IdFactura - a.IdFactura)[0];

    await api.post("/detalle-factura", {
      IdFactura: nueva.IdFactura,
      Concepto: datos.concepto,
      Cantidad: datos.cantidad,
      PrecioUnitario: datos.precioUnitario,
      Subtotal: datos.cantidad * datos.precioUnitario,
    });
  },

  async cambiarEstado(id: number, nuevoEstado: "Pagada" | "Anulada", montoTotal?: number, metodoPago?: MetodoPago) {
    if (nuevoEstado === "Pagada" && metodoPago && montoTotal != null) {
      // El trigger TR_Pago_ActualizarFactura marca la factura como "Pagada"
      // automáticamente cuando el monto pagado cubre el total.
      await api.post("/pagos", {
        IdFactura: id,
        Monto: montoTotal,
        MetodoPago: METODO_A_BD[metodoPago],
      });
    } else {
      await api.patch(`/facturas/${id}/estado`, { Estado: nuevoEstado });
    }
  },
};