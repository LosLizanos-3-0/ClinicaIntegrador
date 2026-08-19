import React, { useEffect, useState } from "react";
import type { RegistroBitacora } from "../../types/clinica.types";
import { bitacoraService } from "../../services/bitacora.service";

const COLUMNAS_TABLA_BITACORA = "1.1fr 1.3fr 0.9fr 0.9fr 1.2fr 0.6fr";

const ROL_COLOR: Record<string, string> = {
  Administrador: "badge-soft-purple",
  Médico:        "badge-soft-emerald",
  Recepcionista: "badge-soft-blue",
  Farmacéutico:  "badge-soft-teal",
};

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-CR");
}

function ModalDetalle({ registro, onCerrar }: { registro: RegistroBitacora; onCerrar: () => void }) {
  let contenido = registro.registro;
  try {
    contenido = JSON.stringify(JSON.parse(registro.registro), null, 2);
  } catch {
    contenido = registro.registro;
  }

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 640 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {registro.tabla} · {registro.accion}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>
        <div className="p-4">
          <p className="fs-12 text-secondary mb-2">
            {formatearFecha(registro.fecha)} · Usuario: {registro.usuarioSql}
            {registro.rol ? ` · Rol: ${registro.rol}` : ""}
          </p>
          <pre className="bg-soft border rounded p-3 fs-12" style={{ maxHeight: 360, overflow: "auto" }}>
            {contenido}
          </pre>
        </div>
        <div className="px-4 py-3 border-top d-flex justify-content-end">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function GestionBitacora() {
  const [registros, setRegistros] = useState<RegistroBitacora[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroTabla, setFiltroTabla] = useState<string>("Todas");
  const [detalle, setDetalle] = useState<RegistroBitacora | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await bitacoraService.listar();
      setRegistros(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const tablas = Array.from(new Set(registros.map((r) => r.tabla))).sort();

  const registrosFiltrados = registros.filter((r) => {
    const texto = busqueda.trim().toLowerCase();
    const coincideTexto =
      texto === "" ||
      r.tabla.toLowerCase().includes(texto) ||
      r.accion.toLowerCase().includes(texto) ||
      r.usuarioSql.toLowerCase().includes(texto) ||
      (r.rol ?? "").toLowerCase().includes(texto);
    const coincideTabla = filtroTabla === "Todas" || r.tabla === filtroTabla;
    return coincideTexto && coincideTabla;
  });

  const badgeAccion = (accion: string) => {
    if (accion === "INSERT" || accion === "EXITOSO") return "badge-soft-green";
    if (accion === "UPDATE") return "badge-soft-amber";
    if (accion === "DELETE" || accion === "FALLIDO") return "badge-soft-red";
    return "badge-soft-gray";
  };

  const etiquetaAccion = (accion: string) => {
    if (accion === "EXITOSO") return "Login exitoso";
    if (accion === "FALLIDO") return "Login fallido";
    return accion;
  };

  return (
    <>
      {detalle && <ModalDetalle registro={detalle} onCerrar={() => setDetalle(null)} />}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Bitácora del sistema</h2>
          <button onClick={cargar} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Actualizar
          </button>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando bitácora…</p>
          ) : (
            <>
              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <i className="bi bi-search text-secondary fs-6" aria-hidden="true" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por tabla, usuario, rol o acción…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
                <select
                  value={filtroTabla}
                  onChange={(e) => setFiltroTabla(e.target.value)}
                  className="form-select form-select-sm bg-soft"
                  style={{ maxWidth: 220 }}
                >
                  <option value="Todas">Todas las tablas</option>
                  {tablas.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="border rounded overflow-hidden">
                <div
                  className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                  style={{ display: "grid", gridTemplateColumns: COLUMNAS_TABLA_BITACORA, letterSpacing: ".03em" }}
                >
                  <span>Tabla</span><span>Usuario</span><span>Rol</span><span>Acción</span><span>Fecha</span><span className="text-center">Detalle</span>
                </div>

                {registrosFiltrados.length === 0 && (
                  <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron registros.</p>
                )}

                {registrosFiltrados.map((r) => (
                  <div
                    key={r.id}
                    className="px-3 py-3 border-bottom align-items-center fs-6 hover-row d-grid"
                    style={{ gridTemplateColumns: COLUMNAS_TABLA_BITACORA }}
                  >
                    <p className="fw-medium text-dark mb-0">{r.tabla}</p>
                    <p className="text-secondary fs-12 mb-0">{r.usuarioSql}</p>
                    <div>
                      {r.rol ? (
                        <span className={`badge-soft ${ROL_COLOR[r.rol] ?? "badge-soft-gray"}`}>{r.rol}</span>
                      ) : (
                        <span className="text-secondary fs-12">—</span>
                      )}
                    </div>
                    <div>
                      <span className={`badge-soft ${badgeAccion(r.accion)}`}>{etiquetaAccion(r.accion)}</span>
                    </div>
                    <p className="text-secondary fs-12 mb-0">{formatearFecha(r.fecha)}</p>
                    <div className="d-flex align-items-center justify-content-center">
                      <button
                        onClick={() => setDetalle(r)}
                        className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye-fill" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}