import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useClinicaStore } from "../../types/clinicaStore";
import { calcularTotalConIva } from "../../services/factura.service";
import {
  reporteService,
  type DashboardData,
  type CitaReporte,
  type MedicamentoReporte,
  type FacturaReporte,
  type PacienteReporte,
} from "../../services/reporte.service";
import type { KPI, BarraEspecialidad } from "../../types/clinica.types";

// ─── Config de tipos/sub-tipos de reporte ──────────────────────────────────────
type TipoPrincipal = "Citas" | "Inventario" | "Facturación" | "Pacientes";

const TIPOS: TipoPrincipal[] = ["Citas", "Inventario", "Facturación", "Pacientes"];

const SUBTIPOS: Record<TipoPrincipal, { value: string; label: string }[]> = {
  Citas: [
    { value: "rango", label: "Reporte de citas por rango de fecha" },
    { value: "especialidad", label: "Reporte de citas por especialidad" },
  ],
  Inventario: [
    { value: "categoria", label: "Reporte de medicamentos por categoría del stock actual" },
  ],
  "Facturación": [
    { value: "ingresos", label: "Reporte de ingresos por rango de fecha" },
    { value: "especialidad", label: "Reporte de facturación por especialidad" },
  ],
  Pacientes: [
    { value: "nuevos", label: "Reporte de nuevos pacientes por rango de fecha" },
  ],
};

const necesitaFechas = (tipo: TipoPrincipal, subtipo: string) => !(tipo === "Inventario" && subtipo === "categoria");
const necesitaEspecialidad = (_tipo: TipoPrincipal, subtipo: string) => subtipo === "especialidad";
const necesitaCategoria = (tipo: TipoPrincipal, subtipo: string) => tipo === "Inventario" && subtipo === "categoria";

const formatoColones = (valor: number) =>
  valor.toLocaleString("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

type ResultadoReporte =
  | { tipo: "citas"; filas: CitaReporte[] }
  | { tipo: "medicamentos"; filas: MedicamentoReporte[] }
  | { tipo: "facturas"; filas: FacturaReporte[] }
  | { tipo: "pacientes"; filas: PacienteReporte[] };

interface MetaReporte {
  tipo: TipoPrincipal;
  subtipo: string;
  desde: string;
  hasta: string;
  especialidadNombre?: string;
  categoriaNombre?: string;
}

// Un reporte ya generado, guardado en el historial (persistido en localStorage)
interface ReporteGuardado {
  id: string;
  tipo: TipoPrincipal;
  subtipo: string;
  nombre: string;
  generadoEn: string; // ISO
  meta: MetaReporte;
  resultado: ResultadoReporte;
}

const CLAVE_HISTORIAL = "clinica_reportes_historial";
const MAX_HISTORIAL = 50;

function cargarHistorialLocal(): ReporteGuardado[] {
  try {
    const raw = localStorage.getItem(CLAVE_HISTORIAL);
    return raw ? (JSON.parse(raw) as ReporteGuardado[]) : [];
  } catch {
    return [];
  }
}

function guardarHistorialLocal(historial: ReporteGuardado[]) {
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial.slice(0, MAX_HISTORIAL)));
  } catch (err) {
    console.error("No se pudo guardar el historial de reportes:", err);
  }
}

// ─── Dona SVG ───────────────────────────────────────────────────────────────
interface SegmentoDonut { porcentaje: number; color: string; label: string; }

function DonutChart({ segmentos, size = 100, grosor = 14 }: { segmentos: SegmentoDonut[]; size?: number; grosor?: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {segmentos.map((s, i) => {
        const dash = (s.porcentaje / 100) * circunferencia;
        const el = (
          <circle
            key={i} cx={size / 2} cy={size / 2} r={radio} fill="none"
            stroke={s.color} strokeWidth={grosor}
            strokeDasharray={`${dash} ${circunferencia - dash}`}
            strokeDashoffset={-acumulado}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        acumulado += dash;
        return el;
      })}
    </svg>
  );
}

const COLOR_BARRA = ["bg-primary", "bg-success", "bg-purple-bar", "bg-warning", "bg-orange-bar"];
const COLOR_ESTADO: Record<string, string> = {
  Atendida: "#378ADD",
  Confirmada: "#1D9E75",
  Programada: "#94A3B8",
  Cancelada: "#EF9F27",
};
const ETIQUETA_ESTADO: Record<string, string> = {
  Atendida: "Completadas",
  Confirmada: "Confirmadas",
  Programada: "Programadas",
  Cancelada: "Canceladas",
};

function formatoHora(hora: string): string {
  try {
    return new Date(hora).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return hora;
  }
}

function columnasYFilas(resultado: ResultadoReporte): { headers: string[]; rows: (string | number)[][] } {
  switch (resultado.tipo) {
    case "citas":
      return {
        headers: ["Fecha", "Hora", "Paciente", "Médico", "Especialidad", "Estado"],
        rows: resultado.filas.map((c) => [
          new Date(c.FechaCita).toLocaleDateString("es-CR"),
          formatoHora(c.HoraCita),
          c.Paciente,
          c.Medico,
          c.Especialidad,
          c.Estado,
        ]),
      };
    case "medicamentos":
      return {
        headers: ["Medicamento", "Presentación", "Ubicación", "Stock actual", "Stock mínimo", "Precio unitario"],
        rows: resultado.filas.map((m) => [
          m.NombreMedicamento,
          m.Presentacion ?? "—",
          m.Ubicacion,
          m.StockActual,
          m.StockMinimo,
          m.PrecioUnitario,
        ]),
      };
    case "facturas":
      return {
        headers: ["Fecha", "Paciente", ...(resultado.filas[0]?.Especialidad ? ["Especialidad"] : []), "Consulta", "Medicamentos", "Total (IVA incl.)", "Estado"],
        rows: resultado.filas.map((f) => [
          new Date(f.FechaEmision).toLocaleDateString("es-CR"),
          f.Paciente,
          ...(f.Especialidad ? [f.Especialidad] : []),
          f.MontoConsulta,
          f.MontoReceta,
          calcularTotalConIva(f.Total),
          f.Estado,
        ]),
      };
    case "pacientes":
      return {
        headers: ["Nombre completo", "Cédula", "Teléfono", "Correo", "Fecha de registro"],
        rows: resultado.filas.map((p) => [
          `${p.Nombre} ${p.Apellido1} ${p.Apellido2 ?? ""}`.trim(),
          p.Cedula,
          p.Telefono ?? "—",
          p.Correo ?? "—",
          new Date(p.FechaRegistro).toLocaleDateString("es-CR"),
        ]),
      };
  }
}

function nombreReporte(tipo: TipoPrincipal, subtipo: string): string {
  const opcion = SUBTIPOS[tipo].find((s) => s.value === subtipo);
  return opcion?.label ?? tipo;
}

// Nombre distintivo para el historial: cambia según categoría/especialidad/fechas
function nombreDistintivo(meta: MetaReporte): string {
  const f = (iso: string) => new Date(iso).toLocaleDateString("es-CR");
  const clave = `${meta.tipo}:${meta.subtipo}`;
  switch (clave) {
    case "Citas:rango":
      return `Citas — ${f(meta.desde)} al ${f(meta.hasta)}`;
    case "Citas:especialidad":
      return `Citas de ${meta.especialidadNombre} — ${f(meta.desde)} al ${f(meta.hasta)}`;
    case "Inventario:categoria":
      return `Medicamentos de ${meta.categoriaNombre} del stock actual`;
    case "Facturación:ingresos":
      return `Ingresos — ${f(meta.desde)} al ${f(meta.hasta)}`;
    case "Facturación:especialidad":
      return `Facturación de ${meta.especialidadNombre} — ${f(meta.desde)} al ${f(meta.hasta)}`;
    case "Pacientes:nuevos":
      return `Nuevos pacientes — ${f(meta.desde)} al ${f(meta.hasta)}`;
    default:
      return nombreReporte(meta.tipo, meta.subtipo);
  }
}

function slug(texto: string): string {
  return texto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function detallesReporte(meta: MetaReporte): string[] {
  const detalles: string[] = [];
  if (necesitaFechas(meta.tipo, meta.subtipo)) detalles.push(`Rango: ${meta.desde} a ${meta.hasta}`);
  if (meta.especialidadNombre) detalles.push(`Especialidad: ${meta.especialidadNombre}`);
  if (meta.categoriaNombre) detalles.push(`Categoría: ${meta.categoriaNombre}`);
  detalles.push(`Generado: ${new Date().toLocaleString("es-CR")}`);
  return detalles;
}

// Líneas de resumen al final del reporte, según su tipo — se usan tanto en el
// PDF como en el CSV. El formato de moneda se recibe como parámetro porque el
// PDF y el CSV necesitan formatos distintos (ver formatoColonesPdf más abajo).
function lineasResumen(resultado: ResultadoReporte, formatoMoneda: (valor: number) => string): string[] {
  switch (resultado.tipo) {
    case "facturas": {
      const total = resultado.filas.reduce((acc, f) => acc + calcularTotalConIva(f.Total), 0);
      return [`Ingresos totales en general: ${formatoMoneda(total)}`];
    }
    case "citas": {
      const atendidas = resultado.filas.filter((c) => c.Estado === "Atendida").length;
      const canceladas = resultado.filas.filter((c) => c.Estado === "Cancelada").length;
      return [`Citas atendidas: ${atendidas}`, `Citas canceladas: ${canceladas}`];
    }
    case "medicamentos": {
      const stockMinimo = resultado.filas.filter((m) => m.StockActual <= m.StockMinimo).length;
      const stockNormal = resultado.filas.length - stockMinimo;
      return [`Medicamentos con stock normal: ${stockNormal}`, `Medicamentos con stock mínimo: ${stockMinimo}`];
    }
    case "pacientes":
      return [`Pacientes nuevos: ${resultado.filas.length}`];
  }
}

// Las fuentes estándar de los PDF (Helvetica) no incluyen el glifo del colón
// "₡" — por eso se veía mal y arrastraba el espaciado de toda la línea. En el
// PDF se usa el prefijo "CRC" (código ISO de la moneda) en su lugar; en
// pantalla y en el CSV el símbolo "₡" se mantiene porque ahí sí se ve bien.
function formatoColonesPdf(valor: number): string {
  return `CRC ${Math.round(valor).toLocaleString("en-US")}`;
}

// ─── Exportar a CSV ───────────────────────────────────────────────────────────
function descargarCsv(
  nombreArchivo: string,
  encabezados: string[],
  filas: (string | number)[][],
  meta: { titulo: string; subtitulo: string; detalles: string[]; resumen?: string[] }
) {
  const DELIM = ";";
  const necesitaComillas = (v: string) => /[;"\n]/.test(v);
  const escapar = (v: string | number) => {
    if (typeof v === "number") return String(v);
    const texto = String(v);
    return necesitaComillas(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const encabezadoDocumento = [meta.titulo, meta.subtitulo, ...meta.detalles, ""];
  const filaEncabezado = encabezados.join(DELIM);
  const filasDatos = filas.map((f) => f.map(escapar).join(DELIM));
  const pie = meta.resumen && meta.resumen.length > 0 ? ["", ...meta.resumen] : [];

  const contenido = [...encabezadoDocumento, filaEncabezado, ...filasDatos, ...pie].join("\r\n");
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Construir PDF (reutilizable: descargar o previsualizar) ─────────────────
function construirPdf(resultado: ResultadoReporte, meta: MetaReporte): jsPDF {
  const { headers, rows } = columnasYFilas(resultado);
  const doc = new jsPDF({ orientation: "landscape" });
  const margenX = 14;
  let y = 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("ClinicSoft", margenX, y);

  y += 7;
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(nombreReporte(meta.tipo, meta.subtipo), margenX, y);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(detallesReporte(meta).join("   ·   "), margenX, y);

  autoTable(doc, {
    startY: y + 5,
    head: [headers],
    body: rows.map((fila) => fila.map((v) => String(v))),
    theme: "striped",
    headStyles: { fillColor: [55, 138, 221], textColor: 255, fontSize: 9, halign: "left" },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margenX, right: margenX },
    didDrawPage: (data) => {
      const totalPaginas = doc.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${totalPaginas}`,
        doc.internal.pageSize.getWidth() - margenX,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  const resumen = lineasResumen(resultado, formatoColonesPdf);
  if (resumen.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? y + 10;
    doc.setCharSpace(0);
    doc.setFont("helvetica", "normal"); // sin negritas: se ve más serio y consistente con el resto del documento
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(resumen.join("   ·   "), margenX, finalY + 8);
  }

  return doc;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionReportes() {
  const { especialidades, categoriasMedicamento } = useClinicaStore();
  const especialidadesActivas = especialidades.filter((e) => e.estado === "Activa");
  const categoriasActivas = categoriasMedicamento.filter((c) => c.estado === "A");

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState<boolean>(true);

  useEffect(() => {
    reporteService
      .dashboard()
      .then(setDashboard)
      .catch((err) => console.error("No se pudo cargar el dashboard:", err))
      .finally(() => setCargandoDashboard(false));
  }, []);

  const kpis: KPI[] = dashboard
    ? [
        { label: "Citas del día", valor: String(dashboard.kpis.CitasHoy), icono: "bi-calendar-check-fill", colorClase: "badge-soft-blue" },
        { label: "Ingresos del mes", valor: formatoColones(calcularTotalConIva(dashboard.kpis.IngresosMes)), icono: "bi-cash-stack", colorClase: "badge-soft-emerald" },
        { label: "Pacientes registrados", valor: String(dashboard.kpis.PacientesRegistrados), icono: "bi-people-fill", colorClase: "badge-soft-amber" },
        { label: "Medicamentos con stock bajo", valor: String(dashboard.kpis.MedicamentosStockBajo), icono: "bi-exclamation-triangle-fill", colorClase: "badge-soft-purple" },
      ]
    : [];

  const barrasEspecialidad: BarraEspecialidad[] = useMemo(() => {
    const conteos = new Map<string, number>();
    (dashboard?.consultasPorEspecialidad ?? []).forEach((e) => conteos.set(e.Especialidad, e.Cantidad));

    const datos = especialidadesActivas.map((e) => ({
      nombre: e.nombre,
      valor: conteos.get(e.nombre) ?? 0,
    }));

    const max = Math.max(1, ...datos.map((d) => d.valor));
    return datos.map((d, i) => ({
      nombre: d.nombre,
      valor: d.valor,
      max,
      colorClase: COLOR_BARRA[i % COLOR_BARRA.length],
    }));
  }, [dashboard, especialidadesActivas]);

  const segmentosEstado: SegmentoDonut[] = useMemo(() => {
    if (!dashboard) return [];
    const total = dashboard.estadoCitas.reduce((acc, e) => acc + e.Cantidad, 0);
    if (total === 0) return [];
    return dashboard.estadoCitas.map((e) => ({
      porcentaje: Math.round((e.Cantidad / total) * 100),
      color: COLOR_ESTADO[e.Estado] ?? "#94A3B8",
      label: `${ETIQUETA_ESTADO[e.Estado] ?? e.Estado} — ${Math.round((e.Cantidad / total) * 100)}%`,
    }));
  }, [dashboard]);

  // Generador de reportes
  const [tipo, setTipo] = useState<TipoPrincipal>("Citas");
  const [subtipo, setSubtipo] = useState<string>(SUBTIPOS.Citas[0].value);
  const [idEspecialidad, setIdEspecialidad] = useState<number | "">("");
  const [idCategoria, setIdCategoria] = useState<number | "">("");
  const [desde, setDesde] = useState<string>(new Date().toISOString().slice(0, 8) + "01");
  const [hasta, setHasta] = useState<string>(new Date().toISOString().slice(0, 10));
  const [cargandoReporte, setCargandoReporte] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Historial de reportes generados (persistido en el navegador)
  const [historial, setHistorial] = useState<ReporteGuardado[]>(() => cargarHistorialLocal());
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  useEffect(() => {
    guardarHistorialLocal(historial);
  }, [historial]);

  // Vista previa PDF
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewNombre, setPreviewNombre] = useState<string>("");

  const abrirPreview = (r: ReporteGuardado) => {
    setSeleccionadoId(r.id);
    const doc = construirPdf(r.resultado, r.meta);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = doc.output("bloburl") as any as string;
    setPreviewUrl(url);
    setPreviewNombre(r.nombre);
  };

  const cerrarPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewNombre("");
  };

  const handleCambiarTipo = (nuevoTipo: TipoPrincipal) => {
    setTipo(nuevoTipo);
    setSubtipo(SUBTIPOS[nuevoTipo][0].value);
    setIdEspecialidad("");
    setIdCategoria("");
    setError("");
  };

  const handleGenerar = async () => {
    setError("");
    if (necesitaFechas(tipo, subtipo) && (!desde || !hasta)) {
      setError("Selecciona el rango de fechas.");
      return;
    }
    if (necesitaFechas(tipo, subtipo) && desde > hasta) {
      setError('La fecha "desde" no puede ser mayor que "hasta".');
      return;
    }
    if (necesitaEspecialidad(tipo, subtipo) && !idEspecialidad) {
      setError("Selecciona una especialidad.");
      return;
    }
    if (necesitaCategoria(tipo, subtipo) && !idCategoria) {
      setError("Selecciona una categoría de medicamento.");
      return;
    }

    const meta: MetaReporte = {
      tipo,
      subtipo,
      desde,
      hasta,
      especialidadNombre: idEspecialidad ? especialidadesActivas.find((e) => e.id === idEspecialidad)?.nombre : undefined,
      categoriaNombre: idCategoria ? categoriasActivas.find((c) => c.id === idCategoria)?.nombre : undefined,
    };

    setCargandoReporte(true);
    try {
      let resultado: ResultadoReporte;
      if (tipo === "Citas" && subtipo === "rango") {
        resultado = { tipo: "citas", filas: await reporteService.citasRango(desde, hasta) };
      } else if (tipo === "Citas" && subtipo === "especialidad") {
        resultado = { tipo: "citas", filas: await reporteService.citasEspecialidad(desde, hasta, Number(idEspecialidad)) };
      } else if (tipo === "Inventario" && subtipo === "categoria") {
        resultado = { tipo: "medicamentos", filas: await reporteService.medicamentosCategoria(Number(idCategoria)) };
      } else if (tipo === "Facturación" && subtipo === "ingresos") {
        resultado = { tipo: "facturas", filas: await reporteService.ingresosRango(desde, hasta) };
      } else if (tipo === "Facturación" && subtipo === "especialidad") {
        resultado = { tipo: "facturas", filas: await reporteService.facturacionEspecialidad(desde, hasta, Number(idEspecialidad)) };
      } else {
        resultado = { tipo: "pacientes", filas: await reporteService.pacientesNuevos(desde, hasta) };
      }

      const nuevo: ReporteGuardado = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo,
        subtipo,
        nombre: nombreDistintivo(meta),
        generadoEn: new Date().toISOString(),
        meta,
        resultado,
      };

      setHistorial((prev) => [nuevo, ...prev]);
      abrirPreview(nuevo);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al generar el reporte. Intenta de nuevo.");
    } finally {
      setCargandoReporte(false);
    }
  };

  const historialDelTipo = useMemo(
    () => historial.filter((r) => r.tipo === tipo).sort((a, b) => b.generadoEn.localeCompare(a.generadoEn)),
    [historial, tipo]
  );

  const reporteSeleccionado = historial.find((r) => r.id === seleccionadoId) ?? null;

  const eliminarDelHistorial = (id: string) => {
    setHistorial((prev) => prev.filter((r) => r.id !== id));
    if (seleccionadoId === id) setSeleccionadoId(null);
  };

  const handleExportarCsv = () => {
    if (!reporteSeleccionado) return;
    const { headers, rows } = columnasYFilas(reporteSeleccionado.resultado);
    descargarCsv(`${slug(reporteSeleccionado.nombre)}.csv`, headers, rows, {
      titulo: "ClinicSoft",
      subtitulo: nombreReporte(reporteSeleccionado.tipo, reporteSeleccionado.subtipo),
      detalles: detallesReporte(reporteSeleccionado.meta),
      resumen: lineasResumen(reporteSeleccionado.resultado, formatoColones),
    });
  };

  const handleExportarPdf = () => {
    if (!reporteSeleccionado) return;
    const doc = construirPdf(reporteSeleccionado.resultado, reporteSeleccionado.meta);
    doc.save(`${slug(reporteSeleccionado.nombre)}.pdf`);
  };

  return (
    <div className="bg-white rounded-4 border overflow-hidden">
      {/* Vista previa PDF */}
      {previewUrl && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
          style={{ background: "rgba(15,23,42,.7)", zIndex: 1050 }}
        >
          <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom">
            <div>
              <p className="fw-medium text-dark mb-0">{previewNombre}</p>
              <p className="fs-11 text-secondary mb-0">Vista previa — no se ha descargado nada todavía</p>
            </div>
            <button onClick={cerrarPreview} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-x-lg" aria-hidden="true" /> Cerrar vista previa
            </button>
          </div>
          <iframe title="Vista previa del reporte" src={previewUrl} className="flex-fill border-0" style={{ background: "#525659" }} />
        </div>
      )}

      {/* Topbar */}
      <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de reportes</h2>
        <div className="d-flex gap-2">
          <button
            onClick={handleExportarCsv}
            disabled={!reporteSeleccionado}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <i className="bi bi-filetype-csv" aria-hidden="true" /> Exportar CSV
          </button>
          <button
            onClick={handleExportarPdf}
            disabled={!reporteSeleccionado}
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
          >
            <i className="bi bi-file-earmark-pdf" aria-hidden="true" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* ── Generador de reportes ── */}
        <div className="bg-soft border rounded p-3 mb-4">
          <h3 className="fs-6 fw-medium text-dark mb-3">Generar reporte</h3>

          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label fs-12 text-secondary mb-1">Consultas de</label>
              <select
                value={tipo}
                onChange={(e) => handleCambiarTipo(e.target.value as TipoPrincipal)}
                className="form-select form-select-sm"
              >
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Reporte</label>
              <select
                value={subtipo}
                onChange={(e) => setSubtipo(e.target.value)}
                className="form-select form-select-sm"
              >
                {SUBTIPOS[tipo].map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {necesitaEspecialidad(tipo, subtipo) && (
              <div className="col-md-3">
                <label className="form-label fs-12 text-secondary mb-1">Especialidad</label>
                <select
                  value={idEspecialidad}
                  onChange={(e) => setIdEspecialidad(e.target.value ? Number(e.target.value) : "")}
                  className="form-select form-select-sm"
                >
                  <option value="">Selecciona…</option>
                  {especialidadesActivas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            )}

            {necesitaCategoria(tipo, subtipo) && (
              <div className="col-md-3">
                <label className="form-label fs-12 text-secondary mb-1">Categoría</label>
                <select
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value ? Number(e.target.value) : "")}
                  className="form-select form-select-sm"
                >
                  <option value="">Selecciona…</option>
                  {categoriasActivas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          {necesitaFechas(tipo, subtipo) && (
            <div className="row g-2 mt-1">
              <div className="col-md-3">
                <label className="form-label fs-12 text-secondary mb-1">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="form-control form-control-sm" />
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 text-secondary mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="form-control form-control-sm" />
              </div>
            </div>
          )}

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12 mt-3">{error}</div>
          )}

          <div className="mt-3">
            <button onClick={handleGenerar} className="btn btn-primary btn-sm" disabled={cargandoReporte}>
              {cargandoReporte ? "Generando…" : "Generar reporte"}
            </button>
          </div>
        </div>

        {/* ── Historial del tipo seleccionado ── */}
        <div className="border rounded overflow-hidden mb-4">
          <div className="px-3 py-2 bg-soft border-bottom">
            <span className="fs-12 fw-medium text-dark">Historial de reportes — {tipo}</span>
          </div>

          {historialDelTipo.length === 0 ? (
            <p className="px-3 py-4 text-center fs-12 text-secondary mb-0">
              Todavía no has generado reportes de {tipo}.
            </p>
          ) : (
            <div className="d-flex flex-column">
              {historialDelTipo.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSeleccionadoId(r.id)}
                  className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between hover-row"
                  style={{
                    cursor: "pointer",
                    background: r.id === seleccionadoId ? "rgba(55,138,221,.08)" : undefined,
                    borderLeft: r.id === seleccionadoId ? "3px solid #378ADD" : "3px solid transparent",
                  }}
                >
                  <div>
                    <p className="fs-12 fw-medium text-dark mb-0">{r.nombre}</p>
                    <p className="fs-11 text-secondary mb-0">
                      Generado {new Date(r.generadoEn).toLocaleString("es-CR")}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirPreview(r); }}
                      title="Ver vista previa en PDF"
                      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                    >
                      <i className="bi bi-eye" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarDelHistorial(r.id); }}
                      title="Quitar del historial"
                      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── KPIs ── */}
        {cargandoDashboard ? (
          <p className="fs-6 text-secondary text-center py-4">Cargando indicadores…</p>
        ) : (
          <>
            <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
              {kpis.map((k) => (
                <div key={k.label} className="col">
                  <div className="bg-soft border rounded p-3">
                    <div
                      className={`icon-box badge-soft ${k.colorClase} mb-2 d-inline-flex align-items-center justify-content-center`}
                      style={{ borderRadius: ".5rem", width: 36, height: 36 }}
                    >
                      <i className={`bi ${k.icono} fs-5`} aria-hidden="true" />
                    </div>
                    <p className="fs-4 fw-medium text-dark mb-0">{k.valor}</p>
                    <p className="fs-11 text-secondary mt-1 mb-0">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="bg-soft border rounded p-3 h-100">
                  <h3 className="fs-6 fw-medium text-dark mb-3">Consultas por especialidad del mes actual</h3>
                  {barrasEspecialidad.length === 0 ? (
                    <p className="fs-12 text-secondary mb-0">No hay especialidades activas registradas.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {barrasEspecialidad.map((e) => (
                        <div key={e.nombre} className="d-flex align-items-center gap-2">
                          <span className="fs-12 text-secondary text-end flex-shrink-0" style={{ width: 96 }}>{e.nombre}</span>
                          <div className="bar-thin flex-fill">
                            <div className={e.colorClase} style={{ width: `${(e.valor / e.max) * 100}%` }} />
                          </div>
                          <span className="fs-11 text-secondary text-end" style={{ width: 32 }}>{e.valor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="bg-soft border rounded p-3 h-100">
                  <h3 className="fs-6 fw-medium text-dark mb-3">Estado de citas del mes actual</h3>
                  {segmentosEstado.length === 0 ? (
                    <p className="fs-12 text-secondary mb-0">Aún no hay citas este mes.</p>
                  ) : (
                    <div className="d-flex align-items-center gap-4">
                      <DonutChart segmentos={segmentosEstado} />
                      <ul className="list-unstyled d-flex flex-column gap-2 fs-12 text-secondary mb-0">
                        {segmentosEstado.map((s) => (
                          <li key={s.label} className="d-flex align-items-center gap-2">
                            <span className="rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: s.color }} />
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}