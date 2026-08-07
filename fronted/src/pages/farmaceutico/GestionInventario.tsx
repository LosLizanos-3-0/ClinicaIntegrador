import React, { useState } from "react";
import type { Medicamento } from "../../types/clinica.types";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";

const COLUMNAS_TABLA_INVENTARIO = "1.8fr 1.2fr 1.2fr 1fr 0.9fr 0.7fr";

type FormMedicamento = Omit<Medicamento, "id" | "estado" | "categoria"> & { id?: number };

const FORM_VACIO: FormMedicamento = {
  nombre: "",
  descripcion: "",
  idCategoria: 0,
  presentacion: "",
  ubicacion: "",
  stockActual: 0,
  stockMinimo: 0,
  precioUnitario: 0,
};

const TEXTO_LIBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]*$/;

interface ModalMedicamentoProps {
  medicamento?: Medicamento;
  categorias: { id: number; nombre: string; estado: "A" | "I" }[];
  onGuardar: (form: FormMedicamento) => Promise<void>;
  onCerrar: () => void;
}

function ModalMedicamento({ medicamento, categorias, onGuardar, onCerrar }: ModalMedicamentoProps) {
  const esNuevo = !medicamento?.id;
  const [form, setForm] = useState<FormMedicamento>(
    medicamento ? { ...medicamento } : { ...FORM_VACIO }
  );
  const [error, setError] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  const categoriasDisponibles = categorias.filter(
    (c) => c.estado === "A" || c.id === form.idCategoria
  );

  const handleChange = <K extends keyof FormMedicamento>(campo: K, valor: FormMedicamento[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async () => {
    const nombre = form.nombre.trim();
    const ubicacion = form.ubicacion.trim();
    const descripcion = (form.descripcion ?? "").trim();
    const presentacion = (form.presentacion ?? "").trim();

    if (!nombre || nombre.length < 2) {
      setError("El nombre del medicamento es obligatorio.");
      return;
    }
    if (!TEXTO_LIBRE_REGEX.test(nombre)) {
      setError("El nombre del medicamento contiene caracteres no válidos.");
      return;
    }
    if (!form.idCategoria || form.idCategoria <= 0) {
      setError("Debes seleccionar una categoría.");
      return;
    }
    if (descripcion && !TEXTO_LIBRE_REGEX.test(descripcion)) {
      setError("La descripción contiene caracteres no válidos.");
      return;
    }
    if (presentacion && !TEXTO_LIBRE_REGEX.test(presentacion)) {
      setError("La presentación contiene caracteres no válidos.");
      return;
    }
    if (!ubicacion || ubicacion.length < 2) {
      setError("La ubicación es obligatoria.");
      return;
    }
    if (!TEXTO_LIBRE_REGEX.test(ubicacion)) {
      setError("La ubicación contiene caracteres no válidos.");
      return;
    }
    if (esNuevo && (!Number.isFinite(form.stockActual) || form.stockActual < 0)) {
      setError("El stock actual no puede ser negativo.");
      return;
    }
    if (!Number.isFinite(form.stockMinimo) || form.stockMinimo < 0) {
      setError("El stock mínimo no puede ser negativo.");
      return;
    }
    if (!Number.isFinite(form.precioUnitario) || form.precioUnitario < 0) {
      setError("El precio unitario no puede ser negativo.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await onGuardar({ ...form, nombre, ubicacion, descripcion, presentacion });
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el medicamento. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 480 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Añadir medicamento" : "Modificar medicamento"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-12 text-secondary mb-1">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Acetaminofén 500mg"
              className="form-control form-control-sm"
            />
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Categoría</label>
            <select
              value={form.idCategoria || ""}
              onChange={(e) => handleChange("idCategoria", Number(e.target.value))}
              className="form-select form-select-sm"
            >
              <option value="">Selecciona una categoría</option>
              {categoriasDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Descripción</label>
            <input
              value={form.descripcion ?? ""}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              placeholder="Analgésico y antipirético"
              className="form-control form-control-sm"
            />
          </div>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Presentación</label>
              <input
                value={form.presentacion ?? ""}
                onChange={(e) => handleChange("presentacion", e.target.value)}
                placeholder="Tabletas"
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Ubicación</label>
              <input
                value={form.ubicacion}
                onChange={(e) => handleChange("ubicacion", e.target.value)}
                placeholder="Estante A1"
                className="form-control form-control-sm"
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Stock actual</label>
              <input
                type="number"
                value={form.stockActual}
                onChange={(e) => handleChange("stockActual", Number(e.target.value))}
                className="form-control form-control-sm"
                disabled={!esNuevo}
                title={!esNuevo ? "El stock actual no se puede modificar desde este formulario" : undefined}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Stock mínimo</label>
              <input
                type="number"
                value={form.stockMinimo}
                onChange={(e) => handleChange("stockMinimo", Number(e.target.value))}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Precio unitario (₡)</label>
              <input
                type="number"
                value={form.precioUnitario}
                onChange={(e) => handleChange("precioUnitario", Number(e.target.value))}
                className="form-control form-control-sm"
              />
            </div>
          </div>

          {!esNuevo && (
            <p className="fs-11 text-secondary mb-0">
              El stock actual solo se modifica mediante la entrega de recetas.
            </p>
          )}

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm" disabled={guardando}>Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? "Guardando…" : esNuevo ? "Añadir medicamento" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionInventario() {
  const { medicamentos, categoriasMedicamento, cargando } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [modalMedicamento, setModalMedicamento] = useState<Medicamento | null | undefined>(undefined);

  const medicamentosFiltrados = medicamentos.filter((m) => {
    const texto = busqueda.trim().toLowerCase();
    return (
      texto === "" ||
      m.nombre.toLowerCase().includes(texto) ||
      m.ubicacion.toLowerCase().includes(texto) ||
      (m.categoria ?? "").toLowerCase().includes(texto)
    );
  });

  const stats = {
    total: medicamentos.length,
    bajoStock: medicamentos.filter((m) => m.stockActual <= m.stockMinimo && m.stockActual > 0).length,
    agotados: medicamentos.filter((m) => m.stockActual === 0).length,
  };

  const estadoStock = (m: Medicamento) => {
    if (m.stockActual === 0) return { label: "Agotado", clase: "badge-soft-red" };
    if (m.stockActual <= m.stockMinimo) return { label: "Stock bajo", clase: "badge-soft-amber" };
    return { label: "Disponible", clase: "badge-soft-green" };
  };

  const guardarMedicamento = async (form: FormMedicamento) => {
    if (form.id) {
      await clinicaStore.actualizarMedicamento({ ...form, id: form.id });
    } else {
      await clinicaStore.crearMedicamento(form);
    }
    setModalMedicamento(undefined);
  };

  return (
    <>
      {modalMedicamento !== undefined && (
        <ModalMedicamento
          medicamento={modalMedicamento ?? undefined}
          categorias={categoriasMedicamento}
          onGuardar={guardarMedicamento}
          onCerrar={() => setModalMedicamento(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de inventario</h2>
          <button onClick={() => setModalMedicamento(null)} className="btn btn-primary btn-sm">
            + Añadir medicamento
          </button>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando inventario…</p>
          ) : (
            <>
              <div className="row row-cols-3 g-3 mb-4">
                <div className="col"><StatCard label="Medicamentos" value={stats.total} /></div>
                <div className="col"><StatCard label="Stock bajo" value={stats.bajoStock} color="text-warning" /></div>
                <div className="col"><StatCard label="Agotados" value={stats.agotados} color="text-danger" /></div>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <i className="bi bi-search text-secondary fs-6" aria-hidden="true" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, ubicación o categoría…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
              </div>

              <div className="border rounded overflow-hidden">
                <div
                  className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                  style={{ display: "grid", gridTemplateColumns: COLUMNAS_TABLA_INVENTARIO, letterSpacing: ".03em" }}
                >
                  <span>Medicamento</span><span>Categoría</span><span>Ubicación</span><span>Stock</span><span>Estado</span><span className="text-center">Acciones</span>
                </div>

                {medicamentosFiltrados.length === 0 && (
                  <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron medicamentos.</p>
                )}

                {medicamentosFiltrados.map((m) => {
                  const estado = estadoStock(m);
                  const activo = m.estado === "A";
                  return (
                    <div
                      key={m.id}
                      className="px-3 py-3 border-bottom align-items-center fs-6 hover-row d-grid"
                      style={{ gridTemplateColumns: COLUMNAS_TABLA_INVENTARIO, opacity: activo ? 1 : 0.6 }}
                    >
                      <div>
                        <p className="fw-medium text-dark mb-0">{m.nombre}</p>
                        <p className="fs-11 text-secondary mb-0">{m.presentacion || "—"}{m.descripcion ? ` · ${m.descripcion}` : ""}</p>
                      </div>
                      <p className="text-secondary fs-12 mb-0">{m.categoria || "—"}</p>
                      <p className="text-secondary fs-12 mb-0">{m.ubicacion}</p>
                      <p className="fs-12 mb-0">{m.stockActual} <span className="text-secondary">/ min {m.stockMinimo}</span></p>
                      <div>
                        <span className={`badge-soft ${estado.clase}`}>{estado.label}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          onClick={() => setModalMedicamento(m)}
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                          title="Modificar"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => clinicaStore.toggleEstadoMedicamento(m.id)}
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                          title={activo ? "Desactivar" : "Activar"}
                        >
                          <i className={`bi ${activo ? "bi-lock-fill" : "bi-unlock-fill"}`} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
