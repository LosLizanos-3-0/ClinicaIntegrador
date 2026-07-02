/**
 * GestionEspecialidades.tsx
 * RF03 – Gestión de Médicos / Especialidades
 *   ✔ Registrar especialidades
 *   ✔ Asignar / quitar médicos a especialidades
 *   ✔ Editar especialidades
 *   ✔ Eliminar / desactivar especialidades
 *   ✔ Vista cuadrícula y lista
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3
 * (usa clases auxiliares definidas en clinica-admin.css)
 *
 * Los datos de usuarios y especialidades viven en `clinicaStore.ts`, un store
 * compartido con GestionUsuarios.tsx. Los "médicos" de una especialidad ya NO
 * son una lista aparte: son los usuarios con rol "Médico" cuyo
 * `especialidadId` coincide con esta especialidad. Así, cualquier médico
 * creado/editado desde la pantalla de Usuarios aparece aquí automáticamente,
 * y viceversa.
 */

import React, { useState, useMemo } from "react";
import type { EstadoEspecialidad } from "../types/clinica.types";
import { clinicaStore, useClinicaStore, type UsuarioClinica, type EspecialidadClinica } from "../types/clinicaStore";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type Vista = "grid" | "list";
type FormEspecialidad = Omit<EspecialidadClinica, "id"> & { id?: number };

interface ModalEspecialidadProps {
  especialidad?: EspecialidadClinica;
  onGuardar: (form: FormEspecialidad) => void;
  onCerrar: () => void;
}

interface ModalGestionMedicosProps {
  titulo: string;
  todosMedicos: UsuarioClinica[];
  medicosAsignados: UsuarioClinica[];
  onAgregar: (medicoId: number) => void;
  onQuitar: (medicoId: number) => void;
  onCerrar: () => void;
  vistaInicial?: "lista" | "agregar";
}

// ─── Modal: gestionar médicos de una especialidad ─────────────────────────────
// Los médicos que aparecen aquí son los usuarios con rol "Médico" registrados
// en Gestión de usuarios. Asignar/quitar aquí actualiza ese mismo usuario.
function ModalGestionMedicos({
  titulo,
  todosMedicos,
  medicosAsignados,
  onAgregar,
  onQuitar,
  onCerrar,
  vistaInicial = "lista",
}: ModalGestionMedicosProps) {
  const [vista, setVista] = useState<"lista" | "agregar">(vistaInicial);
  const [busqueda, setBusqueda] = useState<string>("");

  const idsAsignados = useMemo(() => new Set(medicosAsignados.map((m) => m.id)), [medicosAsignados]);

  const medicosDisponibles = useMemo(
    () =>
      todosMedicos.filter(
        (m) => !idsAsignados.has(m.id) && m.nombre.toLowerCase().includes(busqueda.toLowerCase())
      ),
    [todosMedicos, idsAsignados, busqueda]
  );

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 448 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {vista === "lista" ? titulo : "Agregar médico"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4">
          {vista === "lista" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fs-12 text-secondary">
                  {medicosAsignados.length} médico{medicosAsignados.length === 1 ? "" : "s"} asignado{medicosAsignados.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => { setBusqueda(""); setVista("agregar"); }}
                  className="btn btn-primary btn-sm"
                >
                  + Agregar médico
                </button>
              </div>

              {medicosAsignados.length === 0 ? (
                <p className="py-4 text-center fs-6 text-secondary">
                  Aún no hay médicos asignados a esta especialidad.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                  {medicosAsignados.map((m) => (
                    <div key={m.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2">
                      <div className="d-flex flex-column">
                        <span className="fs-6 text-dark">{m.nombre}</span>
                        <span className="fs-11 text-secondary">{m.correo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onQuitar(m.id)}
                        aria-label={`Quitar a ${m.nombre} de la especialidad`}
                        title="Quitar de la especialidad"
                        className="btn btn-outline-danger btn-icon-sm"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {vista === "agregar" && (
            <>
              <div className="d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2 mb-3">
                <span className="text-secondary fs-6">🔍</span>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar médico…"
                  autoFocus
                  className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                />
              </div>

              {medicosDisponibles.length === 0 ? (
                <p className="py-4 text-center fs-6 text-secondary">No hay médicos disponibles para agregar.</p>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                  {medicosDisponibles.map((m) => (
                    <div key={m.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2">
                      <div className="d-flex flex-column">
                        <span className="fs-6 text-dark">{m.nombre}</span>
                        <span className="fs-11 text-secondary">{m.correo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAgregar(m.id)}
                        aria-label={`Agregar a ${m.nombre} a la especialidad`}
                        title="Agregar a la especialidad"
                        className="btn btn-outline-primary btn-icon-sm"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setVista("lista")}
                className="btn btn-link btn-sm text-secondary text-decoration-none mt-3 p-0"
              >
                ← Volver a médicos asignados
              </button>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
function ModalEspecialidad({ especialidad, onGuardar, onCerrar }: ModalEspecialidadProps) {
  const esNueva = !especialidad?.id;
  const { usuarios } = useClinicaStore();

  const [form, setForm] = useState<FormEspecialidad>({
    nombre:      especialidad?.nombre      ?? "",
    codigo:      especialidad?.codigo      ?? "",
    icono:       especialidad?.icono       ?? "🏥",
    colorFondo:  especialidad?.colorFondo  ?? "avatar-blue",
    estado:      especialidad?.estado      ?? "Activa",
    medicos:     especialidad?.medicos     ?? 0,
    consultorios:especialidad?.consultorios ?? 1,
    tags:        especialidad?.tags        ?? [],
    ...(especialidad?.id ? { id: especialidad.id } : {}),
  });
  const [tagInput, setTagInput] = useState<string>("");
  const [gestionMedicosAbierta, setGestionMedicosAbierta] = useState(false);

  const todosMedicos = usuarios.filter((u) => u.rol === "Médico");
  const medicosAsignados = especialidad ? todosMedicos.filter((m) => m.especialidadId === especialidad.id) : [];

  const handleChange = <K extends keyof FormEspecialidad>(campo: K, valor: FormEspecialidad[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const agregarTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  };

  const quitarTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.codigo.trim()) {
      alert("Nombre y código son obligatorios.");
      return;
    }
    onGuardar(form);
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 448 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNueva ? "Nueva especialidad" : "Editar especialidad"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Nombre</label>
              <input value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Cardiología"
                className="form-control form-control-sm" />
            </div>
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Código</label>
              <input value={form.codigo} onChange={(e) => handleChange("codigo", e.target.value)}
                placeholder="COD-001"
                className="form-control form-control-sm" />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Icono (emoji)</label>
              <input value={form.icono} onChange={(e) => handleChange("icono", e.target.value)}
                className="form-control form-control-sm" />
            </div>
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Estado</label>
              <select value={form.estado} onChange={(e) => handleChange("estado", e.target.value as EstadoEspecialidad)}
                className="form-select form-select-sm">
                <option>Activa</option>
                <option>Inactiva</option>
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Médicos asignados</label>
              <div className="d-flex align-items-center gap-2 border rounded px-2 py-1 bg-soft">
                <span className="fs-6 text-dark flex-fill">
                  {medicosAsignados.length} médico{medicosAsignados.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => setGestionMedicosAbierta(true)}
                  disabled={esNueva}
                  aria-label="Agregar médicos a la especialidad"
                  title={esNueva ? "Guarda la especialidad primero para poder asignar médicos" : "Agregar médicos"}
                  className="btn btn-outline-primary btn-icon-sm bg-white"
                >
                  +
                </button>
              </div>
              {esNueva && (
                <p className="fs-11 text-secondary mt-1 mb-0">
                  Guarda la especialidad primero; luego podrás asignarle médicos.
                </p>
              )}
            </div>
            <div className="col-6">
              <label className="form-label fs-12 text-secondary mb-1">Consultorios</label>
              <input type="number" min={0} value={form.consultorios}
                onChange={(e) => handleChange("consultorios", Number(e.target.value))}
                className="form-control form-control-sm" />
            </div>
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Etiquetas</label>
            <div className="d-flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarTag())}
                placeholder="Agregar etiqueta…"
                className="form-control form-control-sm" />
              <button onClick={agregarTag} className="btn btn-light btn-sm">+</button>
            </div>
            <div className="d-flex gap-1 flex-wrap">
              {form.tags.map((t) => (
                <span key={t} className="d-flex align-items-center gap-1 fs-11 px-2 py-1 rounded-pill border text-secondary">
                  {t}
                  <button onClick={() => quitarTag(t)} className="btn btn-link p-0 text-secondary lh-1 text-decoration-none">✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm">
            {esNueva ? "Crear especialidad" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {gestionMedicosAbierta && especialidad && (
        <ModalGestionMedicos
          titulo="Médicos asignados"
          todosMedicos={todosMedicos}
          medicosAsignados={medicosAsignados}
          onAgregar={(medicoId) => clinicaStore.asignarEspecialidadAMedico(medicoId, especialidad.id)}
          onQuitar={(medicoId) => clinicaStore.quitarEspecialidadDeMedico(medicoId)}
          onCerrar={() => setGestionMedicosAbierta(false)}
          vistaInicial="agregar"
        />
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionEspecialidades() {
  const { usuarios, especialidades } = useClinicaStore();

  const [busqueda,        setBusqueda]       = useState<string>("");
  const [filtroEstado,    setFiltroEstado]   = useState<string>("Todos");
  const [vista,           setVista]          = useState<Vista>("grid");
  const [modal,           setModal]          = useState<EspecialidadClinica | null | undefined>(undefined);
  const [modalMedicosId,  setModalMedicosId] = useState<number | null>(null);

  const medicos = usuarios.filter((u) => u.rol === "Médico");
  const medicosDe = (especialidadId: number) => medicos.filter((m) => m.especialidadId === especialidadId);

  const stats = useMemo(() => ({
    total:        especialidades.length,
    activas:      especialidades.filter((e) => e.estado === "Activa").length,
    medicos:      medicos.filter((m) => !!m.especialidadId).length,
    consultorios: especialidades.reduce((a, e) => a + e.consultorios, 0),
  }), [especialidades, medicos]);

  const filtradas = useMemo(() => {
    return especialidades.filter((e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtroEstado === "Todos" || e.estado === filtroEstado)
    );
  }, [especialidades, busqueda, filtroEstado]);

  const guardar = (form: FormEspecialidad) => {
    if (form.id) {
      clinicaStore.actualizarEspecialidad(form as EspecialidadClinica);
    } else {
      clinicaStore.crearEspecialidad(form);
    }
    setModal(undefined);
  };

  const eliminar = (id: number) => {
    if (window.confirm("¿Eliminar esta especialidad? Los médicos asignados quedarán sin especialidad.")) {
      clinicaStore.eliminarEspecialidad(id);
    }
  };

  const especialidadModalMedicos = especialidades.find((e) => e.id === modalMedicosId) ?? null;

  return (
    <>
      {modal !== undefined && (
        <ModalEspecialidad
          especialidad={modal ?? undefined}
          onGuardar={guardar}
          onCerrar={() => setModal(undefined)}
        />
      )}

      {especialidadModalMedicos && (
        <ModalGestionMedicos
          titulo={`Médicos · ${especialidadModalMedicos.nombre}`}
          todosMedicos={medicos}
          medicosAsignados={medicosDe(especialidadModalMedicos.id)}
          onAgregar={(medicoId) => clinicaStore.asignarEspecialidadAMedico(medicoId, especialidadModalMedicos.id)}
          onQuitar={(medicoId) => clinicaStore.quitarEspecialidadDeMedico(medicoId)}
          onCerrar={() => setModalMedicosId(null)}
          vistaInicial="lista"
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de especialidades</h2>
            <p className="fs-12 text-secondary mt-1 mb-0"></p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => setModal(null)} className="btn btn-primary btn-sm">
              + Nueva especialidad
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Stats */}
          <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
            <div className="col"><StatCard label="Especialidades"      value={stats.total} /></div>
            <div className="col"><StatCard label="Activas"             value={stats.activas}      color="text-success" /></div>
            <div className="col"><StatCard label="Médicos asignados"   value={stats.medicos}      color="text-primary" /></div>
            <div className="col"><StatCard label="Consultorios activos" value={stats.consultorios} /></div>
          </div>

          {/* Filtros + toggle vista */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <span className="text-secondary fs-6">🔍</span>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar especialidad…"
                className="form-control form-control-sm border-0 bg-transparent shadow-none p-0" />
            </div>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="form-select form-select-sm bg-soft" style={{ maxWidth: 220 }}>
              <option value="Todos">Todos los estados</option>
              <option>Activa</option>
              <option>Inactiva</option>
            </select>
            <div className="d-flex gap-1">
              <button onClick={() => setVista("grid")}
                className={`btn btn-sm ${vista === "grid" ? "btn-outline-primary" : "btn-outline-secondary"}`}>
                ▦ Cuadrícula
              </button>
              <button onClick={() => setVista("list")}
                className={`btn btn-sm ${vista === "list" ? "btn-outline-primary" : "btn-outline-secondary"}`}>
                ☰ Lista
              </button>
            </div>
          </div>

          {filtradas.length === 0 && (
            <p className="py-5 text-center fs-6 text-secondary">No se encontraron especialidades.</p>
          )}

          {/* Vista cuadrícula */}
          {vista === "grid" && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {filtradas.map((e) => {
                const cantidadMedicos = medicosDe(e.id).length;
                return (
                  <div key={e.id} className="col">
                    <div
                      className={`position-relative bg-white border rounded-4 p-3 card-hover-primary ${e.estado === "Inactiva" ? "opacity-60" : ""}`}>
                      <div className="position-absolute top-0 end-0 mt-3 me-3 d-flex gap-1">
                        <button onClick={() => setModal(e)} aria-label="Editar"
                          className="btn btn-outline-secondary btn-icon-sm bg-white">✎</button>
                        <button onClick={() => eliminar(e.id)} aria-label="Eliminar"
                          className="btn btn-outline-secondary btn-icon-sm bg-white btn-icon-danger">🗑</button>
                      </div>
                      <div className={`avatar-circle ${e.colorFondo} mb-2`} style={{ width: "2.5rem", height: "2.5rem", borderRadius: ".5rem", fontSize: "1.25rem" }}>{e.icono}</div>
                      <p className="fs-6 fw-medium text-dark mb-0">{e.nombre}</p>
                      <div className="d-flex align-items-center gap-2 mt-1 mb-2">
                        <span className="fs-11 text-secondary">{e.codigo}</span>
                        <span className={`badge-soft ${e.estado === "Activa" ? "badge-soft-green" : "badge-soft-gray"}`}>
                          {e.estado}
                        </span>
                      </div>
                      <div className="d-flex gap-3 mb-2 fs-12 text-secondary">
                        <button
                          type="button"
                          onClick={() => setModalMedicosId(e.id)}
                          title="Ver médicos asignados"
                          className="btn btn-link p-0 fs-12 text-secondary text-decoration-underline"
                        >
                          👥 {cantidadMedicos} médicos
                        </button>
                        <span>🚪 {e.consultorios} consultorios</span>
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        {e.tags.map((t) => (
                          <span key={t} className="fs-10 px-2 py-1 rounded-pill border text-secondary">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista lista */}
          {vista === "list" && (
            <div className="border rounded overflow-hidden">
              <div className="grid-especialidades-list d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom" style={{ letterSpacing: ".03em" }}>
                <span>Especialidad</span><span>Código</span><span>Estado</span><span>Médicos</span><span>Consultorios</span><span>Acciones</span>
              </div>
              {filtradas.map((e) => {
                const cantidadMedicos = medicosDe(e.id).length;
                return (
                  <div key={e.id}
                    className={`grid-especialidades-list px-3 py-3 border-bottom align-items-center fs-6 hover-row ${e.estado === "Inactiva" ? "opacity-60" : ""}`}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`avatar-circle ${e.colorFondo}`} style={{ borderRadius: ".375rem", fontSize: ".875rem" }}>{e.icono}</span>
                      <span className="fw-medium text-dark">{e.nombre}</span>
                    </div>
                    <span className="text-secondary fs-12">{e.codigo}</span>
                    <span className={`badge-soft w-fit-content ${e.estado === "Activa" ? "badge-soft-green" : "badge-soft-gray"}`}>{e.estado}</span>
                    <button
                      type="button"
                      onClick={() => setModalMedicosId(e.id)}
                      title="Ver médicos asignados"
                      className="btn btn-link p-0 text-secondary text-decoration-underline text-start"
                    >
                      {cantidadMedicos}
                    </button>
                    <span className="text-secondary">{e.consultorios}</span>
                    <div className="d-flex gap-1">
                      <button onClick={() => setModal(e)} aria-label="Editar"
                        className="btn btn-outline-secondary btn-icon-sm bg-white">✎</button>
                      <button onClick={() => eliminar(e.id)} aria-label="Eliminar"
                        className="btn btn-outline-secondary btn-icon-sm bg-white btn-icon-danger">🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
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
