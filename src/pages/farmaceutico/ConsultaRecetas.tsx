import React, { useState } from "react";
import type { Receta } from "../../types/clinica.types";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";

const ESTADO_COLOR: Record<Receta["estado"], string> = {
  Pendiente: "badge-soft-amber",
  Validada: "badge-soft-blue",
  Entregada: "badge-soft-green",
};

export default function ConsultaRecetas() {
  const { recetas } = useClinicaStore();

  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [recetaActiva, setRecetaActiva] = useState<Receta | null>(null);
  const [idIngresado, setIdIngresado] = useState<string>("");
  const [error, setError] = useState<string>("");

  const recetasFiltradas = recetas.filter((r) => {
    const coincideEstado = filtroEstado === "Todos" || r.estado === filtroEstado;
    const texto = busqueda.trim().toLowerCase();
    const coincideBusqueda =
      texto === "" ||
      r.paciente.toLowerCase().includes(texto) ||
      r.cedulaPaciente.includes(texto) ||
      String(r.id).includes(texto);
    return coincideEstado && coincideBusqueda;
  });

  const stats = {
    pendientes: recetas.filter((r) => r.estado === "Pendiente").length,
    validadas: recetas.filter((r) => r.estado === "Validada").length,
    entregadas: recetas.filter((r) => r.estado === "Entregada").length,
  };

  const abrirReceta = (r: Receta) => {
    setRecetaActiva(r);
    setIdIngresado("");
    setError("");
  };

  const cerrarModal = () => {
    setRecetaActiva(null);
    setIdIngresado("");
    setError("");
  };

  const handleValidar = () => {
    if (!recetaActiva) return;
    const idNumerico = Number(idIngresado.trim());
    if (!idNumerico) {
      setError("Ingresa el número de receta que lleva el paciente.");
      return;
    }
    const exito = clinicaStore.validarReceta(recetaActiva.id, idNumerico);
    if (!exito) {
      setError("El número de receta no coincide.");
      return;
    }
    setError("");
    setRecetaActiva({ ...recetaActiva, estado: "Validada" });
  };

  const handleEntregar = () => {
    if (!recetaActiva) return;
    clinicaStore.marcarRecetaEntregada(recetaActiva.id);
    setRecetaActiva({ ...recetaActiva, estado: "Entregada" });
  };

  return (
    <>
      {recetaActiva && (
        <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
          <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 480 }}>
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <h3 className="fs-6 fw-medium text-dark mb-0">Receta #{recetaActiva.id}</h3>
              <button onClick={cerrarModal} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
            </div>

            <div className="p-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="fw-medium text-dark mb-0">{recetaActiva.paciente}</p>
                  <p className="fs-11 text-secondary mb-0">Cédula {recetaActiva.cedulaPaciente}</p>
                </div>
                <span className={`badge-soft ${ESTADO_COLOR[recetaActiva.estado]}`}>{recetaActiva.estado}</span>
              </div>

              <div className="bg-soft border rounded p-3">
                <p className="fs-11 text-secondary mb-1">Médico tratante</p>
                <p className="fs-12 text-dark mb-0">{recetaActiva.medico} · {recetaActiva.especialidad}</p>
                <p className="fs-11 text-secondary mt-2 mb-0">Fecha de emisión: {recetaActiva.fecha}</p>
              </div>

              <div>
                <p className="fs-12 fw-medium text-dark mb-2">Medicamentos recetados</p>
                <div className="d-flex flex-column gap-2">
                  {recetaActiva.items.map((item, i) => (
                    <div key={i} className="bg-soft border rounded p-2">
                      <p className="fs-12 fw-medium text-dark mb-0">{item.medicamento} × {item.cantidad}</p>
                      <p className="fs-11 text-secondary mb-0">{item.indicaciones}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
              )}

              {recetaActiva.estado === "Pendiente" && (
                <div>
                  <label className="form-label fs-12 text-secondary mb-1">
                    Número de receta que presenta el paciente
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      value={idIngresado}
                      onChange={(e) => setIdIngresado(e.target.value)}
                      placeholder="Ej: 1001"
                      className="form-control form-control-sm"
                    />
                    <button onClick={handleValidar} className="btn btn-primary btn-sm flex-shrink-0">
                      Validar receta
                    </button>
                  </div>
                </div>
              )}

              {recetaActiva.estado === "Validada" && (
                <button onClick={handleEntregar} className="btn btn-success btn-sm w-100">
                  Marcar medicamento como entregado
                </button>
              )}

              {recetaActiva.estado === "Entregada" && (
                <p className="fs-12 text-success text-center mb-0">Medicamento entregado al paciente.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Consulta de recetas</h2>
        </div>

        <div className="p-4">
          <div className="row row-cols-3 g-3 mb-4">
            <div className="col"><StatCard label="Pendientes" value={stats.pendientes} color="text-warning" /></div>
            <div className="col"><StatCard label="Validadas" value={stats.validadas} color="text-primary" /></div>
            <div className="col"><StatCard label="Entregadas" value={stats.entregadas} color="text-success" /></div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <span className="text-secondary fs-6"></span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por: paciente, cédula o número de receta…"
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
              <option>Pendiente</option>
              <option>Validada</option>
              <option>Entregada</option>
            </select>
          </div>

          {recetasFiltradas.length === 0 && (
            <p className="fs-6 text-secondary text-center py-4 mb-0">No hay recetas para este filtro.</p>
          )}

          <div className="d-flex flex-column gap-2">
            {recetasFiltradas.map((r) => (
              <div key={r.id} className="border rounded p-3 d-flex align-items-center justify-content-between hover-row">
                <div>
                  <p className="fs-12 text-secondary mb-0">Receta #{r.id}</p>
                  <p className="fw-medium text-dark mb-0">{r.paciente}</p>
                  <p className="fs-11 text-secondary mb-0">{r.medico} · {r.especialidad} · {r.fecha}</p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <span className={`badge-soft ${ESTADO_COLOR[r.estado]}`}>{r.estado}</span>
                  <button onClick={() => abrirReceta(r)} className="btn btn-outline-secondary btn-sm">
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

function StatCard({ label, value, color = "text-dark" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-soft border rounded px-3 py-3">
      <p className={`fs-4 fw-medium mb-0 ${color}`}>{value}</p>
      <p className="fs-11 text-secondary mt-1 mb-0">{label}</p>
    </div>
  );
}