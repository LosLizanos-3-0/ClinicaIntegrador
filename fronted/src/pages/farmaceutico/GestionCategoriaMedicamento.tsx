import { useState } from "react";
import type { CategoriaMedicamento } from "../../types/clinica.types";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";

const COLUMNAS_TABLA_CATEGORIAS = "1.6fr 2fr 0.9fr 0.7fr";
const TEXTO_LIBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.,+%/() -]*$/;

type FormCategoria = Omit<CategoriaMedicamento, "id" | "estado"> & { id?: number };

const FORM_VACIO: FormCategoria = {
  nombre: "",
  comentario: "",
};

interface ModalCategoriaProps {
  categoria?: CategoriaMedicamento;
  onGuardar: (form: FormCategoria) => Promise<void>;
  onCerrar: () => void;
}

function ModalCategoria({ categoria, onGuardar, onCerrar }: ModalCategoriaProps) {
  const esNueva = !categoria?.id;
  const [form, setForm] = useState<FormCategoria>(
    categoria ? { ...categoria } : { ...FORM_VACIO }
  );
  const [error, setError] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  const handleChange = <K extends keyof FormCategoria>(campo: K, valor: FormCategoria[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async () => {
    const nombre = form.nombre.trim();
    const comentario = (form.comentario ?? "").trim();

    if (!nombre || nombre.length < 2) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    if (!TEXTO_LIBRE_REGEX.test(nombre)) {
      setError("El nombre de la categoría contiene caracteres no válidos.");
      return;
    }
    if (comentario && !TEXTO_LIBRE_REGEX.test(comentario)) {
      setError("El comentario contiene caracteres no válidos.");
      return;
    }
    if (comentario.length > 300) {
      setError("El comentario es demasiado largo.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await onGuardar({ ...form, nombre, comentario });
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar la categoría. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 420 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNueva ? "Añadir categoría" : "Modificar categoría"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-12 text-secondary mb-1">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Analgésicos"
              className="form-control form-control-sm"
            />
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Comentario</label>
            <input
              value={form.comentario ?? ""}
              onChange={(e) => handleChange("comentario", e.target.value)}
              placeholder="Medicamentos para el dolor y la fiebre"
              className="form-control form-control-sm"
            />
          </div>

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm" disabled={guardando}>Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? "Guardando…" : esNueva ? "Añadir categoría" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionCategoriaMedicamento() {
  const { categoriasMedicamento, cargando } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [modalCategoria, setModalCategoria] = useState<CategoriaMedicamento | null | undefined>(undefined);

  const categoriasFiltradas = categoriasMedicamento.filter((c) => {
    const texto = busqueda.trim().toLowerCase();
    return (
      texto === "" ||
      c.nombre.toLowerCase().includes(texto) ||
      (c.comentario ?? "").toLowerCase().includes(texto)
    );
  });

  const stats = {
    total: categoriasMedicamento.length,
    activas: categoriasMedicamento.filter((c) => c.estado === "A").length,
  };

  const guardarCategoria = async (form: FormCategoria) => {
    if (form.id) {
      await clinicaStore.actualizarCategoriaMedicamento({ ...form, id: form.id });
    } else {
      await clinicaStore.crearCategoriaMedicamento(form);
    }
    setModalCategoria(undefined);
  };

  return (
    <>
      {modalCategoria !== undefined && (
        <ModalCategoria
          categoria={modalCategoria ?? undefined}
          onGuardar={guardarCategoria}
          onCerrar={() => setModalCategoria(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Categorías de medicamentos</h2>
          <button onClick={() => setModalCategoria(null)} className="btn btn-primary btn-sm">
            + Añadir categoría
          </button>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando categorías…</p>
          ) : (
            <>
              <div className="row row-cols-2 g-3 mb-4">
                <div className="col"><StatCard label="Categorías" value={stats.total} /></div>
                <div className="col"><StatCard label="Activas" value={stats.activas} color="text-success" /></div>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <i className="bi bi-search text-secondary fs-6" aria-hidden="true" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o comentario…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
              </div>

              <div className="border rounded overflow-hidden">
                <div
                  className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                  style={{ display: "grid", gridTemplateColumns: COLUMNAS_TABLA_CATEGORIAS, letterSpacing: ".03em" }}
                >
                  <span>Categoría</span><span>Comentario</span><span>Estado</span><span className="text-center">Acciones</span>
                </div>

                {categoriasFiltradas.length === 0 && (
                  <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron categorías.</p>
                )}

                {categoriasFiltradas.map((c) => {
                  const activa = c.estado === "A";
                  return (
                    <div
                      key={c.id}
                      className="px-3 py-3 border-bottom align-items-center fs-6 hover-row d-grid"
                      style={{ gridTemplateColumns: COLUMNAS_TABLA_CATEGORIAS, opacity: activa ? 1 : 0.6 }}
                    >
                      <p className="fw-medium text-dark mb-0">{c.nombre}</p>
                      <p className="text-secondary fs-12 mb-0">{c.comentario || "—"}</p>
                      <div>
                        <span className={`badge-soft ${activa ? "badge-soft-green" : "badge-soft-gray"}`}>
                          {activa ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          onClick={() => setModalCategoria(c)}
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                          title="Modificar"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => clinicaStore.toggleEstadoCategoriaMedicamento(c.id)}
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                          title={activa ? "Desactivar" : "Activar"}
                        >
                          <i className={`bi ${activa ? "bi-lock-fill" : "bi-unlock-fill"}`} aria-hidden="true" />
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
