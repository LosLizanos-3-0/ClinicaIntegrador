import React, { useState } from "react";
import type { KPI, BarraEspecialidad, Reporte, TipoReporte } from "../../types/clinica.types";

// ─── Datos mock ───────────────────────────────────────────────────────────────
const KPIS_MOCK: KPI[] = [
  { label: "Citas del día",        valor: "29", delta: "", positivo: true, icono: "📅", colorClase: "badge-soft-blue" },
  { label: "Ingresos del mes",     valor: "₡48,620", delta: "", positivo: true, icono: "💰", colorClase: "badge-soft-emerald" },
  { label: "Pacientes registrados",        valor: "350",    delta: "-3% vs mes anterior",  positivo: true,  icono: "✅", colorClase: "badge-soft-amber" },
  { label: "Satisfacción promedio",valor: "4.7",   delta: "", positivo: true, icono: "⭐", colorClase: "badge-soft-purple" },
];

const ESPECIALIDADES_MOCK: BarraEspecialidad[] = [
  { nombre: "Cardiología",   valor: 324, max: 324, colorClase: "bg-primary" },
  { nombre: "Pediatría",     valor: 265, max: 324, colorClase: "bg-success" },
  { nombre: "Ginecología",   valor: 218, max: 324, colorClase: "bg-purple-bar" },
  { nombre: "Traumatología", valor: 159, max: 324, colorClase: "bg-warning" },
  { nombre: "Dermatología",  valor: 118, max: 324, colorClase: "bg-orange-bar" },
];
/*Jose Gay*/ 
const REPORTES_MOCK: Reporte[] = [
  { id: 1, nombre: "Reporte de consultas — junio 2025",  fecha: "30/06/2025", autor: "Admin", tipo: "Consultas", colorClase: "badge-soft-blue" },
  { id: 2, nombre: "Ingresos y facturación — junio 2025",fecha: "30/06/2025", autor: "Admin", tipo: "Finanzas",  colorClase: "badge-soft-green" },
];

const TIPOS: TipoReporte[] = ["Consultas", "Finanzas", ];

// Color del badge según el tipo de reporte seleccionado al generarlo
const COLOR_POR_TIPO: Record<TipoReporte, string> = {
  Consultas: "badge-soft-blue",
  Finanzas:  "badge-soft-green",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface GestionReportesProps {
  kpis?:           KPI[];
  especialidades?: BarraEspecialidad[];
  reportes?:       Reporte[];
  onNuevoReporte?: (r: Reporte) => void;
  onVerReporte?:   (r: Reporte) => void;
  onDescargar?:    (r: Reporte) => void;
  onExportar?:     () => void;
}

// ─── Segmento dona ────────────────────────────────────────────────────────────
interface SegmentoDonut {
  porcentaje: number;
  color:      string;
  label:      string;
}

const SEGMENTOS: SegmentoDonut[] = [
  { porcentaje: 65, color: "#378ADD", label: "Completadas — 65%" },
  { porcentaje: 25, color: "#1D9E75", label: "Confirmadas — 25%" },
  { porcentaje: 10, color: "#EF9F27", label: "Canceladas — 10%" },
];

// ─── Componente Dona SVG ──────────────────────────────────────────────────────
function DonutChart({ segmentos, size = 100, grosor = 14 }: { segmentos: SegmentoDonut[]; size?: number; grosor?: number }) {
  const radio         = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado        = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {segmentos.map((s, i) => {
        const dash = (s.porcentaje / 100) * circunferencia;
        const el   = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radio}
            fill="none"
            stroke={s.color}
            strokeWidth={grosor}
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionReportes({
  kpis           = KPIS_MOCK,
  especialidades = ESPECIALIDADES_MOCK,
  reportes:       reportesIniciales = REPORTES_MOCK,
  onNuevoReporte,
  onVerReporte,
  onDescargar,
  onExportar,
}: GestionReportesProps) {
  const [reportes,    setReportes]    = useState<Reporte[]>(reportesIniciales);
  const [filtroTipo,  setFiltroTipo]  = useState<string>("Todos");
  const [desde,       setDesde]       = useState<string>("2025-06-01");
  const [hasta,       setHasta]       = useState<string>("2025-06-30");
  const [modalNuevo,  setModalNuevo]  = useState<boolean>(false);
  const [tipoNuevo,   setTipoNuevo]   = useState<TipoReporte>("Consultas");
  const [nombreNuevo, setNombreNuevo] = useState<string>("");

  const reportesFiltrados =
    filtroTipo === "Todos"
      ? reportes
      : reportes.filter((r) => r.tipo === filtroTipo);

  const handleGenerarReporte = () => {
    if (!nombreNuevo.trim()) { alert("Ingresa un nombre para el reporte."); return; }

    const nuevoReporte: Reporte = {
      id: Date.now(),
      nombre: nombreNuevo.trim(),
      fecha: new Date().toLocaleDateString("es-CR"),
      autor: "Admin",
      tipo: tipoNuevo,
      colorClase: COLOR_POR_TIPO[tipoNuevo],
    };

    setReportes((prev) => [nuevoReporte, ...prev]);
    onNuevoReporte?.(nuevoReporte);
    setModalNuevo(false);
    setNombreNuevo("");
    setTipoNuevo("Consultas");
  };

  /*Se trabajara en reportes*/ 
  return (
    <>
      {/* Modal nuevo reporte */}
      {modalNuevo && (
        <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
          <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 448 }}>
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <h3 className="fs-6 fw-medium text-dark mb-0">Generar nuevo reporte</h3>
              <button onClick={() => setModalNuevo(false)} aria-label="Cerrar" className="btn btn-link text-secondary fs-5 text-decoration-none p-0">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 d-flex flex-column gap-3">
              <div>
                <label className="form-label fs-12 text-secondary mb-1">Nombre del reporte</label>
                <input
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  placeholder="Ej: Reporte de citas julio 2025"
                  className="form-control form-control-sm"
                />
              </div>
              <div>
                <label className="form-label fs-12 text-secondary mb-1">Tipo de reporte</label>
                <select
                  value={tipoNuevo}
                  onChange={(e) => setTipoNuevo(e.target.value as TipoReporte)}
                  className="form-select form-select-sm"
                >
                  {TIPOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fs-12 text-secondary mb-1">Desde</label>
                  <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                    className="form-control form-control-sm" />
                </div>
                <div className="col-6">
                  <label className="form-label fs-12 text-secondary mb-1">Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                    className="form-control form-control-sm" />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
              <button onClick={() => setModalNuevo(false)} className="btn btn-outline-secondary btn-sm">Cancelar</button>
              <button onClick={handleGenerarReporte} className="btn btn-primary btn-sm">Generar reporte</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de reportes</h2>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => onExportar?.()}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-download" aria-hidden="true" /> Exportar
            </button>
            <button
              onClick={() => setModalNuevo(true)}
              className="btn btn-primary btn-sm"
            >
              + Nuevo reporte
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Filtros */}
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="form-select form-select-sm bg-soft"
              style={{ maxWidth: 220 }}
            >
              <option value="Todos">Todos los tipos</option>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="form-control form-control-sm bg-soft" style={{ maxWidth: 170 }} />
            <span className="text-secondary fs-6">—</span>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="form-control form-control-sm bg-soft" style={{ maxWidth: 170 }} />
          </div>

          {/* Lista de reportes generados */}
          <div className="bg-soft border rounded p-3 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="fs-6 fw-medium text-dark mb-0">Reportes generados</h3>
              <span className="fs-11 text-secondary">Últimos 30 días</span>
            </div>

            {reportesFiltrados.length === 0 && (
              <p className="fs-6 text-secondary text-center py-3 mb-0">No hay reportes para este filtro.</p>
            )}

            <div>
              {reportesFiltrados.map((r) => (
                <div key={r.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                  <div>
                    <p className="fs-6 fw-medium text-dark mb-0">{r.nombre}</p>
                    <p className="fs-11 text-secondary mt-1 mb-0">Generado {r.fecha} · por {r.autor}</p>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <span className={`badge-soft ${r.colorClase}`}>{r.tipo}</span>
                    <button onClick={() => onVerReporte?.(r)} aria-label="Ver reporte" title="Ver reporte"
                      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary">
                      <i className="bi bi-eye" aria-hidden="true" />
                    </button>
                    <button onClick={() => onDescargar?.(r)} aria-label="Descargar" title="Descargar"
                      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary">
                      <i className="bi bi-download" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs — al final de la página */}
          <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
            {kpis.map((k) => (
              <div key={k.label} className="col">
                <div className="bg-soft border rounded p-3">
                  <div className={`icon-box badge-soft ${k.colorClase} mb-2`} style={{ borderRadius: ".5rem" }}>{k.icono}</div>
                  <p className="fs-4 fw-medium text-dark mb-0">{k.valor}</p>
                  <p className="fs-11 text-secondary mt-1 mb-0">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráficas — al final de la página */}
          <div className="row g-3">
            {/* RF09 – Reporte de citas por especialidad */}
            <div className="col-md-6">
              <div className="bg-soft border rounded p-3 h-100">
                <h3 className="fs-6 fw-medium text-dark mb-3">Consultas por especialidad</h3>
                <div className="d-flex flex-column gap-2">
                  {especialidades.map((e) => (
                    <div key={e.nombre} className="d-flex align-items-center gap-2">
                      <span className="fs-12 text-secondary text-end flex-shrink-0" style={{ width: 96 }}>{e.nombre}</span>
                      <div className="bar-thin flex-fill">
                        <div
                          className={e.colorClase}
                          style={{ width: `${(e.valor / e.max) * 100}%` }}
                        />
                      </div>
                      <span className="fs-11 text-secondary text-end" style={{ width: 32 }}>{e.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RF09 – Estado de citas */}
            <div className="col-md-6">
              <div className="bg-soft border rounded p-3 h-100">
                <h3 className="fs-6 fw-medium text-dark mb-3">Estado de citas</h3>
                <div className="d-flex align-items-center gap-4">
                  <DonutChart segmentos={SEGMENTOS} />
                  <ul className="list-unstyled d-flex flex-column gap-2 fs-12 text-secondary mb-0">
                    {SEGMENTOS.map((s) => (
                      <li key={s.label} className="d-flex align-items-center gap-2">
                        <span className="rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: s.color }} />
                        {s.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
