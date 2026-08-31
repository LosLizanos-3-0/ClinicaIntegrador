import api from "./api";
import type { Factura, MetodoPago } from "../types/clinica.types";

// El IVA se calcula SOLO en el frontend. La base de datos no lo maneja:
// Factura.Total en la BD sigue siendo MontoConsulta + MontoReceta (sin impuesto).
export const IVA_TASA = 0.13;
export const calcularIva = (subtotal: number) => Math.round(subtotal * IVA_TASA);
export const calcularTotalConIva = (subtotal: number) => subtotal + calcularIva(subtotal);

const METODO_A_BD: Record<MetodoPago, string> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  "Sinpe Móvil": "SINPE",
};

const BD_A_METODO: Record<string, MetodoPago> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  SINPE: "Sinpe Móvil",
};

export const CLINICA_IDENTIFICACION = "677778888";
export const CLINICA_NOMBRE = "CliniSoft";
export const CLINICA_CORREO = "integradorclinica@gmail.com";

interface FacturaBD {
  IdFactura: number;
  IdPaciente: number;
  IdCita: number;
  FechaEmision: string;
  MontoConsulta: number;
  MontoReceta: number;
  Total: number; // sin IVA, viene de la BD
  Estado: "Pendiente" | "Pagada" | "Anulada";
}

interface DetalleFacturaBD {
  IdDetalleFactura: number;
  IdFactura: number;
  IdDetalleReceta: number | null;
  Concepto: string;
  Cantidad: number;
  PrecioUnitario: number;
}

interface PagoBD {
  IdPago: number;
  IdFactura: number;
  Monto: number;
  MetodoPago: string;
  FechaPago?: string;
}

export const facturaService = {
  async listar(pacientesMap: Map<number, { nombre: string; cedula: string }>): Promise<Factura[]> {
    const { data } = await api.get<FacturaBD[]>("/facturas");
    const { data: todosDetalles } = await api.get<DetalleFacturaBD[]>("/detalle-factura");

    let todosPagos: PagoBD[] = [];
    try {
      const { data: pagos } = await api.get<PagoBD[]>("/pagos");
      todosPagos = pagos;
    } catch (error) {
      console.error("No se pudo obtener /pagos:", error);
    }

    return data.map((f) => {
      const paciente = pacientesMap.get(f.IdPaciente);
      const items = todosDetalles
        .filter((d) => d.IdFactura === f.IdFactura)
        .map((d) => ({
          idDetalleFactura: d.IdDetalleFactura,
          idDetalleReceta: d.IdDetalleReceta ?? undefined,
          concepto: d.Concepto,
          cantidad: d.Cantidad,
          precioUnitario: d.PrecioUnitario,
        }));

      const pago = todosPagos
        .filter((p) => p.IdFactura === f.IdFactura)
        .sort((a, b) => b.IdPago - a.IdPago)[0];
      const metodoPago = pago ? BD_A_METODO[pago.MetodoPago] : undefined;

      return {
        id: f.IdFactura,
        pacienteId: f.IdPaciente,
        paciente: paciente?.nombre ?? "",
        cedulaPaciente: paciente?.cedula ?? "",
        citaId: f.IdCita,
        fecha: new Date(f.FechaEmision).toLocaleDateString("es-CR"),
        items,
        montoConsulta: f.MontoConsulta,
        montoReceta: f.MontoReceta,
        total: f.Total, // subtotal sin IVA, tal cual lo calcula la BD
        estado: f.Estado,
        metodoPago,
      };
    });
  },

  // Crea la factura con el monto de consulta digitado por el recepcionista.
  async crear(datos: { IdPaciente: number; IdCita: number; montoConsulta: number }): Promise<number> {
    const { data } = await api.post<{ IdFactura: number }>("/facturas", {
      IdPaciente: datos.IdPaciente,
      IdCita: datos.IdCita,
      MontoConsulta: datos.montoConsulta,
      Estado: "Pendiente",
    });
    return data.IdFactura;
  },

  // Agrega a la factura los medicamentos de la receta marcados como "cobrar aqui".
  async agregarMedicamentosDeReceta(idFactura: number, idReceta: number): Promise<void> {
    await api.post("/detalle-factura/generar-desde-receta", { IdFactura: idFactura, IdReceta: idReceta });
  },

  // montoTotalConIva: lo que realmente se le cobra al paciente (subtotal + 13% IVA).
  // El trigger de la BD solo exige Monto >= Total (sin IVA), así que esto sigue
  // marcando la factura como Pagada sin necesidad de tocar la base de datos.
  async cambiarEstado(id: number, nuevoEstado: "Pagada" | "Anulada", montoTotalConIva?: number, metodoPago?: MetodoPago) {
    if (nuevoEstado === "Pagada" && metodoPago && montoTotalConIva != null) {
      await api.post("/pagos", {
        IdFactura: id,
        Monto: montoTotalConIva,
        MetodoPago: METODO_A_BD[metodoPago],
      });
    } else {
      await api.patch(`/facturas/${id}/estado`, { Estado: nuevoEstado });
    }
  },

  // Emite el comprobante real en Billing Kilometer y devuelve el PDF listo
  // para mostrar/descargar, junto con la clave y el consecutivo fiscal.
  async generarComprobante(idFactura: number, medioPago?: string) {
    const respuesta = await api.post(
      `/facturas/${idFactura}/comprobante`,
      { medioPago },
      { responseType: "blob" }
    );
    return {
      pdfBlob: respuesta.data as Blob,
      clave: respuesta.headers["x-clave"] as string | undefined,
      consecutivo: respuesta.headers["x-consecutivo"] as string | undefined,
      total: respuesta.headers["x-total-comprobante"] as string | undefined,
    };
  },

  // Vista previa en HTML, sin numerar ni gastar consecutivo.
  async previsualizarComprobante(idFactura: number, medioPago?: string): Promise<string> {
    const { data } = await api.post<string>(
      `/facturas/${idFactura}/comprobante/preview`,
      { medioPago },
      { responseType: "text" }
    );
    return data;
  },
};

// Genera un XML simplificado que representa la factura, para enviarlo a
// firmar a HSM Sign CR. No es el formato oficial de Hacienda (XSD v4.4),
// sino una representación propia de los datos reales de la factura.
export function generarXmlFactura(factura: Factura): string {
  const subtotal = factura.total;
  const iva = calcularIva(subtotal);
  const totalConIva = calcularTotalConIva(subtotal);

  const escapar = (valor: string | number) =>
    String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const filasItems = factura.items
    .map(
      (item) => `
    <Item>
      <Concepto>${escapar(item.concepto)}</Concepto>
      <Cantidad>${item.cantidad}</Cantidad>
      <PrecioUnitario>${item.precioUnitario.toFixed(2)}</PrecioUnitario>
    </Item>`
    )
    .join("");

  return `<FacturaElectronica>
  <Emisor>
    <Nombre>${escapar(CLINICA_NOMBRE)}</Nombre>
    <Identificacion>${escapar(CLINICA_IDENTIFICACION)}</Identificacion>
  </Emisor>
  <Receptor>
    <Nombre>${escapar(factura.paciente)}</Nombre>
    <Identificacion>${escapar(factura.cedulaPaciente)}</Identificacion>
  </Receptor>
  <NumeroFactura>${factura.id}</NumeroFactura>
  <FechaEmision>${escapar(factura.fecha)}</FechaEmision>
  <DetalleServicio>
    <Item>
      <Concepto>Consulta médica</Concepto>
      <Cantidad>1</Cantidad>
      <PrecioUnitario>${factura.montoConsulta.toFixed(2)}</PrecioUnitario>
    </Item>${filasItems}
  </DetalleServicio>
  <ResumenFactura>
    <SubTotal>${subtotal.toFixed(2)}</SubTotal>
    <Iva>${iva.toFixed(2)}</Iva>
    <Total>${totalConIva.toFixed(2)}</Total>
  </ResumenFactura>
</FacturaElectronica>`;
}