import React, { useMemo, useState } from "react";
import type {
  EstadoFactura,
  Factura,
  MetodoPago,
} from "../../types/clinica.types";
import { clinicaStore, useClinicaStore } from "../../types/clinicaStore";
import {
  firmarConHSMSignCR,
  describirResultadoFirma,
  validarConHSMSignCR,
} from "../../../../backend/src/services(web)/hsmSignCheckout.js";
import {
  IVA_TASA,
  calcularIva,
  calcularTotalConIva,
  generarXmlFactura,
  CLINICA_IDENTIFICACION,
  facturaService,
} from "../../services/factura.service";
import {
  pagarConBanky,
  describirResultado,
} from "../../../../backend/src/services(web)/bankyCheckout.js";

const ESTADOS: EstadoFactura[] = ["Pendiente", "Pagada", "Anulada"];
const METODOS_PAGO: MetodoPago[] = [
  "Efectivo",
  "Tarjeta",
  "Sinpe Móvil",
  "Transferencia",
];

const ESTADO_COLOR: Record<EstadoFactura, string> = {
  Pendiente: "badge-soft-amber",
  Pagada: "badge-soft-green",
  Anulada: "badge-soft-gray",
};

const PRECIO_POR_ESPECIALIDAD: Record<string, number> = {
  Cardiología: 25000,
  Pediatría: 20000,
  Ginecología: 25000,
  Neurología: 30000,
  Traumatología: 28000,
};
const PRECIO_DEFECTO = 20000;

// Catálogo de Hacienda - Nota 6 (tipoMedioPago), estructura v4.4
const MEDIO_PAGO_HACIENDA: Record<MetodoPago, string> = {
  "Efectivo": "01",
  "Tarjeta": "02",
  "Transferencia": "04",
  "Sinpe Móvil": "06",
};

const formatoColones = (valor: number) =>
  valor.toLocaleString("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

interface ModalNuevaFacturaProps {
  onGuardar: (datos: {
    pacienteId: number;
    citaId?: number;
    montoConsulta: number;
    idsDetalleRecetaSeleccionados?: number[];
    idReceta?: number;
  }) => Promise<string | void>;
  onCerrar: () => void;
}

function ModalNuevaFactura({ onGuardar, onCerrar }: ModalNuevaFacturaProps) {
  const { citas, facturas, recetas } = useClinicaStore();
  const citasYaFacturadasIds = new Set(facturas.map((f) => f.citaId));
  const citasAtendidasSinFacturar = citas.filter(
    (c) => c.estado === "Atendida" && !citasYaFacturadasIds.has(c.id),
  );

  const [citaId, setCitaId] = useState<number | "">("");
  const [montoConsulta, setMontoConsulta] = useState<number>(0);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  const citaSeleccionada = citas.find((c) => c.id === citaId);

  const recetaPendiente = citaSeleccionada
    ? recetas.find(
        (r) => r.citaId === citaSeleccionada.id && r.estado === "Pendiente",
      )
    : undefined;
  const itemsDisponibles = (recetaPendiente?.items ?? []).filter(
    (i) => !i.incluirFactura,
  );

  const handleSeleccionarCita = (id: number | "") => {
    setCitaId(id);
    setSeleccionados(new Set());
    const cita = citas.find((c) => c.id === id);
    setMontoConsulta(
      cita ? (PRECIO_POR_ESPECIALIDAD[cita.especialidad] ?? PRECIO_DEFECTO) : 0,
    );
  };

  const toggleItem = (idDetalleReceta: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idDetalleReceta)) next.delete(idDetalleReceta);
      else next.add(idDetalleReceta);
      return next;
    });
  };

  const montoReceta = useMemo(
    () =>
      itemsDisponibles
        .filter((i) => seleccionados.has(i.idDetalleReceta))
        .reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0),
    [itemsDisponibles, seleccionados],
  );

  const subtotal = montoConsulta + montoReceta;
  const iva = calcularIva(subtotal);
  const total = subtotal + iva;

  const handleSubmit = async () => {
    if (!citaId || !citaSeleccionada) {
      setError("Selecciona la cita atendida a facturar.");
      return;
    }
    if (montoConsulta <= 0) {
      setError("Ingresa el monto de la consulta.");
      return;
    }
    setGuardando(true);
    setError("");
    const resultado = await onGuardar({
      pacienteId: citaSeleccionada.pacienteId,
      citaId: citaSeleccionada.id,
      montoConsulta,
      idsDetalleRecetaSeleccionados: Array.from(seleccionados),
      idReceta: recetaPendiente?.id,
    });
    setGuardando(false);
    if (resultado) setError(resultado);
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 520 }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">Generar factura</h3>
          <button
            onClick={onCerrar}
            className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0"
          >
            ✕
          </button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <Field label="Cita atendida a facturar">
            <select
              value={citaId}
              onChange={(e) =>
                handleSeleccionarCita(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              className="form-select form-select-sm"
            >
              <option value="">Selecciona una cita…</option>
              {citasAtendidasSinFacturar.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.paciente} · {c.especialidad} · {c.fecha}
                </option>
              ))}
            </select>
            {citasAtendidasSinFacturar.length === 0 && (
              <p className="fs-11 text-secondary mt-1 mb-0">
                No hay citas atendidas pendientes de facturar.
              </p>
            )}
          </Field>

          {citaSeleccionada && (
            <>
              <div className="bg-soft border rounded p-2">
                <p className="fs-12 fw-medium text-dark mb-0">
                  {citaSeleccionada.paciente}
                </p>
                <p className="fs-11 text-secondary mb-0">
                  Cédula {citaSeleccionada.cedulaPaciente}
                </p>
              </div>

              <Field
                label={`Monto de la consulta (${citaSeleccionada.especialidad})`}
              >
                <input
                  type="number"
                  min={0}
                  value={montoConsulta}
                  onChange={(e) => setMontoConsulta(Number(e.target.value))}
                  className="form-control form-control-sm"
                />
              </Field>

              {itemsDisponibles.length > 0 && (
                <div>
                  <p className="fs-12 fw-medium text-dark mb-2">
                    El paciente tiene medicamentos recetados. ¿Cuáles desea
                    cancelar aquí?
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {itemsDisponibles.map((item) => (
                      <label
                        key={item.idDetalleReceta}
                        className="border rounded p-2 d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                      >
                        <span className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(item.idDetalleReceta)}
                            onChange={() => toggleItem(item.idDetalleReceta)}
                          />
                          <span className="fs-12 text-dark">
                            {item.medicamento} × {item.cantidad}
                          </span>
                        </span>
                        <span className="fs-12 text-secondary">
                          {formatoColones(item.cantidad * item.precioUnitario)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="fs-11 text-secondary mt-1 mb-0">
                    Lo que no marques, el paciente lo retira en otra farmacia y
                    no se cobra aquí.
                  </p>
                </div>
              )}

              <div className="bg-soft border rounded p-3">
                <div className="d-flex justify-content-between fs-12 text-secondary">
                  <span>Consulta</span>
                  <span>{formatoColones(montoConsulta)}</span>
                </div>
                <div className="d-flex justify-content-between fs-12 text-secondary">
                  <span>Medicamentos</span>
                  <span>{formatoColones(montoReceta)}</span>
                </div>
                <div className="d-flex justify-content-between fs-12 text-secondary">
                  <span>IVA ({(IVA_TASA * 100).toFixed(0)}%)</span>
                  <span>{formatoColones(iva)}</span>
                </div>
                <div className="d-flex justify-content-between fs-6 fw-medium text-dark mt-1 pt-1 border-top">
                  <span>Total a pagar</span>
                  <span>{formatoColones(total)}</span>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button
            onClick={onCerrar}
            className="btn btn-outline-secondary btn-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-sm"
            disabled={guardando}
          >
            {guardando ? "Generando…" : "Generar factura"}
          </button>
        </div>
      </div>
    </div>
  );
}

function imprimirComprobante(factura: Factura) {
  const ventana = window.open("", "_blank", "width=380,height=600");
  if (!ventana) return;

  const fechaImpresion = new Date().toLocaleString("es-CR");
  const subtotal = factura.total; // ya viene sin IVA desde la BD
  const iva = calcularIva(subtotal);
  const totalConIva = calcularTotalConIva(subtotal);

  const filasItems = factura.items
    .map(
      (item) => `
        <tr>
          <td>${item.concepto}</td>
          <td style="text-align:center;">${item.cantidad}</td>
          <td style="text-align:right;">${formatoColones(item.cantidad * item.precioUnitario)}</td>
        </tr>`,
    )
    .join("");

  ventana.document.write(`
    <html>
      <head>
        <title>Comprobante Factura #${factura.id}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 16px; color: #000; }
          h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
          p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 4px 0; font-size: 12px; }
          th { text-align: left; border-bottom: 1px solid #000; }
          .totales td { padding-top: 4px; }
          .total-final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; }
          .centrado { text-align: center; }
          hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Clínica Integradora</h1>
        <p class="centrado">Comprobante de pago</p>
        <hr />
        <p><strong>Factura #${factura.id}</strong></p>
        <p>Fecha emisión: ${factura.fecha}</p>
        <p>Paciente: ${factura.paciente}</p>
        <p>Cédula: ${factura.cedulaPaciente}</p>
        <hr />
        <table>
          <thead>
            <tr><th>Concepto</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">Monto</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Consulta</td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">${formatoColones(factura.montoConsulta)}</td>
            </tr>
            ${filasItems}
          </tbody>
        </table>
        <table class="totales">
          <tr><td>Subtotal</td><td style="text-align:right;">${formatoColones(subtotal)}</td></tr>
          <tr><td>IVA (${(IVA_TASA * 100).toFixed(0)}%)</td><td style="text-align:right;">${formatoColones(iva)}</td></tr>
          <tr class="total-final"><td>Total</td><td style="text-align:right;">${formatoColones(totalConIva)}</td></tr>
        </table>
        <hr />
        <p>Método de pago: ${factura.metodoPago ?? "—"}</p>
        <p class="centrado">¡Gracias por su visita!</p>
        <p class="centrado" style="font-size:10px; color:#555;">Impreso: ${fechaImpresion}</p>
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}

function ModalDetalleFactura({
  factura,
  onCerrar,
}: {
  factura: Factura;
  onCerrar: () => void;
}) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [procesandoBanky, setProcesandoBanky] = useState(false);
  const [errorBanky, setErrorBanky] = useState<string>("");
  const [firmando, setFirmando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [mensajeFirma, setMensajeFirma] = useState<string>("");
  const [xmlFirmadoSesion, setXmlFirmadoSesion] = useState<{
    xml: string;
    hashDocumento: string;
    serialCertificado: string;
    fecha: string;
  } | null>(null);
  const [generandoComprobante, setGenerandoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState<string>("");
  const [comprobante, setComprobante] = useState<{
    clave?: string;
    consecutivo?: string;
    pdfUrl: string;
  } | null>(null);

  const subtotal = factura.total;
  const iva = calcularIva(subtotal);
  const totalConIva = subtotal + iva;

  const handlePagarConBanky = async () => {
    setErrorBanky("");
    setProcesandoBanky(true);
    try {
      const resultado = await pagarConBanky({
        orderId: `FACT-${factura.id}`,
        amount: Math.round(totalConIva),
        description: `Factura #${factura.id} - ${factura.paciente}`,
      });

      if (resultado.status === "completed") {
        // El propio banco ya validó tarjeta y cuenta del pagador dentro
        // de su ventana; aquí solo reflejamos el resultado en la factura.
        clinicaStore.marcarFacturaPagada(
          factura.id,
          "Banky Finanzas" as MetodoPago,
        );
        onCerrar();
        return;
      }

      // "rejected" o "cancelled": se muestra el motivo y se deja la
      // factura como estaba para que puedan intentar de nuevo.
      setErrorBanky(describirResultado(resultado));
    } catch (error: any) {
      // Ocurre cuando el navegador bloqueó la ventana emergente.
      setErrorBanky(
        error?.message ||
          "No fue posible iniciar el pago con Banky Finanzas.",
      );
    } finally {
      setProcesandoBanky(false);
    }
  };

  const handleFirmarFactura = async () => {
    setMensajeFirma("");
    setFirmando(true);
    try {
      const xml = generarXmlFactura(factura);
      const resultado = await firmarConHSMSignCR({
        identificacion: CLINICA_IDENTIFICACION,
        xmlFactura: xml,
      });

      if (resultado.status === "completed" && resultado.xmlFirmado) {
        // No se guarda en nuestra base de datos: la firma y su validez
        // dependen del certificado y de HSM Sign CR, no de nosotros.
        setXmlFirmadoSesion({
          xml: resultado.xmlFirmado,
          hashDocumento: resultado.hashDocumento ?? "",
          serialCertificado: resultado.serialCertificado ?? "",
          fecha: new Date().toISOString(),
        });
        setMensajeFirma("La factura se firmó correctamente.");
      } else {
        setMensajeFirma(describirResultadoFirma(resultado));
      }
    } catch (error: any) {
      setMensajeFirma(error?.message || "No fue posible iniciar la firma digital.");
    } finally {
      setFirmando(false);
    }
  };

  const handleVerificarFirma = async () => {
    if (!xmlFirmadoSesion) return;
    setMensajeFirma("");
    setVerificando(true);
    try {
      const resultado = await validarConHSMSignCR(xmlFirmadoSesion.xml);
      if (resultado.esValida) {
        const fechaFirma = resultado.signatureDate
          ? new Date(resultado.signatureDate).toLocaleString("es-CR")
          : "fecha desconocida";
        setMensajeFirma(
          `Firma válida — firmado por ${resultado.signerName} el ${fechaFirma}.`
        );
      } else {
        setMensajeFirma(`Firma NO válida: ${resultado.motivo}`);
      }
    } catch (error: any) {
      setMensajeFirma(error?.message || "No fue posible verificar la firma.");
    } finally {
      setVerificando(false);
    }
  };

  const handleGenerarComprobante = async () => {
    setErrorComprobante("");
    setGenerandoComprobante(true);
    try {
      const codigoMedioPago =
        MEDIO_PAGO_HACIENDA[factura.metodoPago as MetodoPago] ?? "99";
      const resultado = await facturaService.generarComprobante(
        factura.id,
        codigoMedioPago,
      );
      const pdfUrl = URL.createObjectURL(resultado.pdfBlob);
      setComprobante({
        clave: resultado.clave,
        consecutivo: resultado.consecutivo,
        pdfUrl,
      });
    } catch (error: any) {
      setErrorComprobante(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          "No se pudo generar el comprobante electrónico.",
      );
    } finally {
      setGenerandoComprobante(false);
    }
  };

  const handleVerPreview = async () => {
    setErrorComprobante("");
    try {
      const codigoMedioPago =
        MEDIO_PAGO_HACIENDA[factura.metodoPago as MetodoPago] ?? "99";
      const html = await facturaService.previsualizarComprobante(
        factura.id,
        codigoMedioPago,
      );
      const ventana = window.open("", "_blank");
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      }
    } catch (error: any) {
      setErrorComprobante(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          "No se pudo generar la vista previa.",
      );
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 480 }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            Factura #{factura.id}
          </h3>
          <button
            onClick={onCerrar}
            className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0"
          >
            ✕
          </button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="fw-medium text-dark mb-0">{factura.paciente}</p>
              <p className="fs-11 text-secondary mb-0">
                Cédula {factura.cedulaPaciente} · {factura.fecha}
              </p>
            </div>
            <span className={`badge-soft ${ESTADO_COLOR[factura.estado]}`}>
              {factura.estado}
            </span>
          </div>

          <div>
            <p className="fs-12 fw-medium text-dark mb-2">Detalle</p>
            <div className="d-flex flex-column gap-2">
              <div className="bg-soft border rounded p-2 d-flex justify-content-between">
                <p className="fs-12 fw-medium text-dark mb-0">Consulta</p>
                <p className="fs-12 text-dark mb-0">
                  {formatoColones(factura.montoConsulta)}
                </p>
              </div>
              {factura.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-soft border rounded p-2 d-flex justify-content-between"
                >
                  <div>
                    <p className="fs-12 fw-medium text-dark mb-0">
                      {item.concepto}
                    </p>
                    <p className="fs-11 text-secondary mb-0">
                      Cantidad: {item.cantidad}
                    </p>
                  </div>
                  <p className="fs-12 text-dark mb-0">
                    {formatoColones(item.cantidad * item.precioUnitario)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-soft border rounded p-3">
            <div className="d-flex justify-content-between fs-12 text-secondary">
              <span>Subtotal</span>
              <span>{formatoColones(subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between fs-12 text-secondary">
              <span>IVA ({(IVA_TASA * 100).toFixed(0)}%)</span>
              <span>{formatoColones(iva)}</span>
            </div>
            <div className="d-flex justify-content-between fs-6 fw-medium text-dark mt-1 pt-1 border-top">
              <span>Total</span>
              <span>{formatoColones(totalConIva)}</span>
            </div>
          </div>

          {factura.estado === "Pagada" && factura.metodoPago && (
            <>
              <p className="fs-12 text-success text-center mb-0">
                Pagada con {factura.metodoPago}.
              </p>

              <div className="d-flex flex-column gap-2">
                <p className="fs-12 fw-medium text-dark mb-0">Comprobante electrónico</p>
                {!comprobante ? (
                  <>
                    <p className="fs-11 text-secondary mb-0">
                      Aún no se ha generado el comprobante oficial.
                    </p>
                    <div className="d-flex gap-2">
                      <button
                        onClick={handleVerPreview}
                        className="btn btn-outline-secondary btn-sm flex-fill"
                      >
                        Vista previa
                      </button>
                      <button
                        onClick={handleGenerarComprobante}
                        disabled={generandoComprobante}
                        className="btn btn-primary btn-sm flex-fill"
                      >
                        {generandoComprobante ? "Generando…" : "Generar comprobante"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="badge-soft badge-soft-green w-100 text-start py-2 px-3 fs-11">
                      <p className="mb-0 fw-medium">Comprobante emitido</p>
                      {comprobante.consecutivo && (
                        <p className="mb-0">Consecutivo {comprobante.consecutivo}</p>
                      )}
                      {comprobante.clave && (
                        <p className="mb-0" style={{ wordBreak: "break-all" }}>
                          Clave {comprobante.clave}
                        </p>
                      )}
                    </div>
                    <a
                      href={comprobante.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm w-100"
                    >
                      📄 Ver / descargar PDF
                    </a>
                  </>
                )}
                {errorComprobante && (
                  <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">
                    {errorComprobante}
                  </div>
                )}
              </div>

              <div className="d-flex flex-column gap-2">
                <p className="fs-12 fw-medium text-dark mb-0">Firma digital</p>

                {xmlFirmadoSesion ? (
                  <>
                    <span className="badge-soft badge-soft-green w-fit-content">
                      Firmada
                    </span>
                    <p className="fs-11 text-secondary mb-0">
                      Firmada digitalmente el {new Date(xmlFirmadoSesion.fecha).toLocaleString("es-CR")}.
                    </p>
                    <button
                      onClick={handleVerificarFirma}
                      disabled={verificando}
                      className="btn btn-outline-secondary btn-sm w-100"
                    >
                      {verificando ? "Verificando…" : "🔍 Verificar firma digital"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFirmarFactura}
                    disabled={firmando}
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    {firmando ? "Firmando…" : "🔏 Firmar factura digitalmente"}
                  </button>
                )}

                {mensajeFirma && (
                  <div className="badge-soft badge-soft-blue w-100 text-start py-2 px-3 fs-12">
                    {mensajeFirma}
                  </div>
                )}
              </div>

              <button
                onClick={() => imprimirComprobante(factura)}
                className="btn btn-outline-primary btn-sm w-100"
              >
                🖨️ Imprimir comprobante
              </button>
            </>
          )}

          {factura.estado === "Anulada" && (
            <p className="fs-12 text-secondary text-center mb-0">
              Esta factura fue anulada.
            </p>
          )}

          {factura.estado === "Pendiente" && (
            <>
              <Field label="Método de pago">
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="form-select form-select-sm"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>

              <button
                type="button"
                onClick={handlePagarConBanky}
                disabled={procesandoBanky}
                className="btn btn-sm w-100 text-white"
                style={{ backgroundColor: "#FA9412", borderColor: "#FA9412" }}
              >
                {procesandoBanky
                  ? "Procesando pago…"
                  : "Pagar con Banky Finanzas"}
              </button>

              {errorBanky && (
                <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">
                  {errorBanky}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  onClick={() => {
                    clinicaStore.anularFactura(factura.id);
                    onCerrar();
                  }}
                  disabled={procesandoBanky}
                  className="btn btn-outline-danger btn-sm flex-fill"
                >
                  Anular factura
                </button>
                <button
                  onClick={() => {
                    clinicaStore.marcarFacturaPagada(factura.id, metodoPago);
                    onCerrar();
                  }}
                  disabled={procesandoBanky}
                  className="btn btn-success btn-sm flex-fill"
                >
                  Registrar pago
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GestionFacturas() {
  const { facturas } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [mostrarNueva, setMostrarNueva] = useState<boolean>(false);
  const [facturaActiva, setFacturaActiva] = useState<Factura | null>(null);

  const facturasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return facturas
      .filter((f) => filtroEstado === "Todos" || f.estado === filtroEstado)
      .filter(
        (f) =>
          texto === "" ||
          f.paciente.toLowerCase().includes(texto) ||
          f.cedulaPaciente.includes(texto) ||
          String(f.id).includes(texto),
      )
      .sort((a, b) => b.id - a.id);
  }, [facturas, busqueda, filtroEstado]);

  const stats = {
    pendientes: facturas.filter((f) => f.estado === "Pendiente").length,
    pagadas: facturas.filter((f) => f.estado === "Pagada").length,
    totalCobrado: facturas
      .filter((f) => f.estado === "Pagada")
      .reduce((acc, f) => acc + calcularTotalConIva(f.total), 0),
  };

  const guardarFactura: ModalNuevaFacturaProps["onGuardar"] = async (datos) => {
    try {
      await clinicaStore.crearFactura(datos);
      setMostrarNueva(false);
    } catch (err: any) {
      console.error(err);
      return (
        err?.response?.data?.error ||
        "Ocurrió un error al generar la factura. Intenta de nuevo."
      );
    }
  };

  return (
    <>
      {mostrarNueva && (
        <ModalNuevaFactura
          onGuardar={guardarFactura}
          onCerrar={() => setMostrarNueva(false)}
        />
      )}
      {facturaActiva && (
        <ModalDetalleFactura
          factura={facturaActiva}
          onCerrar={() => setFacturaActiva(null)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">
              Facturación de consultas
            </h2>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setMostrarNueva(true)}
              className="btn btn-primary btn-sm"
            >
              + Generar factura
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Stats */}
          <div className="row row-cols-3 g-3 mb-4">
            <div className="col">
              <StatCard
                label="Pendientes"
                value={stats.pendientes}
                color="text-warning"
              />
            </div>
            <div className="col">
              <StatCard
                label="Pagadas"
                value={stats.pagadas}
                color="text-success"
              />
            </div>
            <div className="col">
              <StatCard
                label="Total cobrado (con IVA)"
                value={formatoColones(stats.totalCobrado)}
                color="text-dark"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <span className="text-secondary fs-6">🔍</span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por paciente, cédula o número de factura…"
                className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="form-select form-select-sm bg-soft"
              style={{ maxWidth: 200 }}
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>

          {facturasFiltradas.length === 0 && (
            <p className="fs-6 text-secondary text-center py-4 mb-0">
              No hay facturas para este filtro.
            </p>
          )}

          <div className="d-flex flex-column gap-2">
            {facturasFiltradas.map((f) => (
              <div
                key={f.id}
                className="border rounded p-3 d-flex align-items-center justify-content-between hover-row"
              >
                <div>
                  <p className="fs-12 text-secondary mb-0">
                    Factura #{f.id} · {f.fecha}
                  </p>
                  <p className="fw-medium text-dark mb-0">{f.paciente}</p>
                  <p className="fs-11 text-secondary mb-0">
                    {f.items.length + 1} concepto(s) ·{" "}
                    {formatoColones(calcularTotalConIva(f.total))} (IVA incl.)
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <span className={`badge-soft ${ESTADO_COLOR[f.estado]}`}>
                    {f.estado}
                  </span>
                  <button
                    onClick={() => setFacturaActiva(f)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  color = "text-dark",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-soft border rounded px-3 py-3">
      <p className={`fs-4 fw-medium mb-0 ${color}`}>{value}</p>
      <p className="fs-11 text-secondary mt-1 mb-0">{label}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label fs-12 text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}