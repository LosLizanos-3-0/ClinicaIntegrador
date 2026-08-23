import { useState, useMemo } from "react";
import type { EstadoEspecialidad } from "../../types/clinica.types";
import {
  clinicaStore,
  useClinicaStore,
  type UsuarioClinica,
  type EspecialidadClinica,
} from "../../types/clinicaStore";
import { validarNombre } from "../../utils/validaciones";

type Vista = "grid" | "list";
type FormEspecialidad = {
  nombre: string;
  estado: EstadoEspecialidad;
  id?: number;
};

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

interface ModalConfirmarEstadoProps {
  especialidad: EspecialidadClinica;
  onConfirmar: () => void;
  onCerrar: () => void;
}

const COLUMNAS_TABLA_ESPECIALIDADES = "1.6fr 0.8fr 0.8fr 0.9fr";

function ModalConfirmarEstado({
  especialidad,
  onConfirmar,
  onCerrar,
}: ModalConfirmarEstadoProps) {
  const vaADesactivar = especialidad.estado === "Activa";
  const accion = vaADesactivar ? "desactivar" : "activar";

  return (
    <div
      className="modal-overlay d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1070 }}
    >
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 420 }}
      >
        <div className="p-4 d-flex flex-column align-items-center text-center">
          <div
            className={`d-flex align-items-center justify-content-center rounded-circle mb-3 ${
              vaADesactivar ? "bg-danger-subtle" : "bg-success-subtle"
            }`}
            style={{ width: 56, height: 56 }}
          >
            <i
              className={`bi bi-exclamation-triangle-fill fs-3 ${
                vaADesactivar ? "text-danger" : "text-success"
              }`}
              aria-hidden="true"
            />
          </div>

          <h3 className="fs-6 fw-semibold text-dark mb-2">
            {vaADesactivar
              ? "¿Desactivar especialidad?"
              : "¿Activar especialidad?"}
          </h3>

          <p className="fs-6 text-secondary mb-0">
            ¿Deseas {accion} la especialidad{" "}
            <strong>{especialidad.nombre}</strong>?
            {vaADesactivar && (
              <>
                {" "}
                No aparecerá disponible para asignar a nuevos médicos mientras
                esté inactiva.
              </>
            )}
          </p>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button
            onClick={onCerrar}
            className="btn btn-outline-secondary btn-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className={`btn btn-sm ${vaADesactivar ? "btn-danger" : "btn-success"}`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const idsAsignados = useMemo(
    () => new Set(medicosAsignados.map((m) => m.id)),
    [medicosAsignados],
  );

  const medicosDisponibles = useMemo(
    () =>
      todosMedicos.filter(
        (m) =>
          !idsAsignados.has(m.id) &&
          m.nombre.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [todosMedicos, idsAsignados, busqueda],
  );

  return (
    <div
      className="modal-overlay d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1060 }}
    >
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 448 }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {vista === "lista" ? titulo : "Agregar médico"}
          </h3>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="btn btn-link text-secondary fs-5 text-decoration-none p-0"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">
          {vista === "lista" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fs-12 text-secondary">
                  {medicosAsignados.length} médico
                  {medicosAsignados.length === 1 ? "" : "s"} asignado
                  {medicosAsignados.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setVista("agregar");
                  }}
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
                <div
                  className="d-flex flex-column gap-2"
                  style={{ maxHeight: 320, overflowY: "auto" }}
                >
                  {medicosAsignados.map((m) => (
                    <div
                      key={m.id}
                      className="d-flex align-items-center justify-content-between border rounded px-3 py-2"
                    >
                      <div className="d-flex flex-column">
                        <span className="fs-6 text-dark">
                          {m.nombre} {m.apellido1}
                        </span>
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
                <i
                  className="bi bi-search text-secondary fs-6"
                  aria-hidden="true"
                />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar médico…"
                  autoFocus
                  className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                />
              </div>

              {medicosDisponibles.length === 0 ? (
                <p className="py-4 text-center fs-6 text-secondary">
                  No hay médicos disponibles para agregar.
                </p>
              ) : (
                <div
                  className="d-flex flex-column gap-2"
                  style={{ maxHeight: 320, overflowY: "auto" }}
                >
                  {medicosDisponibles.map((m) => (
                    <div
                      key={m.id}
                      className="d-flex align-items-center justify-content-between border rounded px-3 py-2"
                    >
                      <div className="d-flex flex-column">
                        <span className="fs-6 text-dark">
                          {m.nombre} {m.apellido1}
                        </span>
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
          <button
            onClick={onCerrar}
            className="btn btn-outline-secondary btn-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEspecialidad({
  especialidad,
  onGuardar,
  onCerrar,
}: ModalEspecialidadProps) {
  const esNueva = !especialidad?.id;
  const { usuarios } = useClinicaStore();

  const [form, setForm] = useState<FormEspecialidad>({
    nombre: especialidad?.nombre ?? "",
    estado: especialidad?.estado ?? "Activa",
    ...(especialidad?.id ? { id: especialidad.id } : {}),
  });
  const [gestionMedicosAbierta, setGestionMedicosAbierta] = useState(false);
  const [error, setError] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  const todosMedicos = usuarios.filter((u) => u.rol === "Médico");
  const medicosAsignados = especialidad
    ? todosMedicos.filter((m) =>
        (m.especialidadIds ?? []).includes(especialidad.id),
      )
    : [];

  const handleChange = <K extends keyof FormEspecialidad>(
    campo: K,
    valor: FormEspecialidad[K],
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async () => {
    if (!validarNombre(form.nombre)) {
      setError("El nombre debe tener solo letras, entre 2 y 50 caracteres.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar({ ...form, nombre: form.nombre.trim() });
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al guardar la especialidad. Intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 420 }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNueva ? "Nueva especialidad" : "Editar especialidad"}
          </h3>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="btn btn-link text-secondary fs-5 text-decoration-none p-0"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-12 text-secondary mb-1">
              Nombre
            </label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Cardiología"
              className="form-control form-control-sm"
            />
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) =>
                handleChange("estado", e.target.value as EstadoEspecialidad)
              }
              className="form-select form-select-sm"
            >
              <option>Activa</option>
              <option>Inactiva</option>
            </select>
          </div>

          {!esNueva && (
            <div>
              <label className="form-label fs-12 text-secondary mb-1">
                Médicos asignados
              </label>
              <div className="d-flex align-items-center gap-2 border rounded px-2 py-1 bg-soft">
                <span className="fs-6 text-dark flex-fill">
                  {medicosAsignados.length} médico
                  {medicosAsignados.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => setGestionMedicosAbierta(true)}
                  aria-label="Agregar médicos a la especialidad"
                  title="Agregar médicos"
                  className="btn btn-outline-primary btn-icon-sm bg-white"
                >
                  +
                </button>
              </div>
            </div>
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
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-sm"
            disabled={guardando}
          >
            {guardando
              ? "Guardando…"
              : esNueva
                ? "Crear especialidad"
                : "Guardar cambios"}
          </button>
        </div>
      </div>

      {gestionMedicosAbierta && especialidad && (
        <ModalGestionMedicos
          titulo="Médicos asignados"
          todosMedicos={todosMedicos}
          medicosAsignados={medicosAsignados}
          onAgregar={(medicoId) =>
            clinicaStore.asignarEspecialidadAMedico(medicoId, especialidad.id)
          }
          onQuitar={(medicoId) =>
            clinicaStore.quitarEspecialidadDeMedico(medicoId, especialidad.id)
          }
          onCerrar={() => setGestionMedicosAbierta(false)}
        />
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionEspecialidades() {
  const { usuarios, especialidades } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [vista, setVista] = useState<Vista>("grid");
  const [modal, setModal] = useState<EspecialidadClinica | null | undefined>(
    undefined,
  );
  const [modalMedicosId, setModalMedicosId] = useState<number | null>(null);
  const [confirmEstado, setConfirmEstado] =
    useState<EspecialidadClinica | null>(null);

  const medicos = usuarios.filter((u) => u.rol === "Médico");
  const medicosDe = (especialidadId: number) =>
    medicos.filter((m) => (m.especialidadIds ?? []).includes(especialidadId));

  const stats = useMemo(
    () => ({
      total: especialidades.length,
      activas: especialidades.filter((e) => e.estado === "Activa").length,
      medicos: medicos.filter((m) => (m.especialidadIds ?? []).length > 0)
        .length,
    }),
    [especialidades, medicos],
  );

  const filtradas = useMemo(() => {
    return especialidades.filter(
      (e) =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        (filtroEstado === "Todos" || e.estado === filtroEstado),
    );
  }, [especialidades, busqueda, filtroEstado]);

  const guardar = (form: FormEspecialidad) => {
    if (form.id) {
      const original = especialidades.find((e) => e.id === form.id);
      if (!original) return;
      clinicaStore.actualizarEspecialidad({
        ...original,
        nombre: form.nombre,
        estado: form.estado,
      });
    } else {
      clinicaStore.crearEspecialidad({ nombre: form.nombre });
    }
    setModal(undefined);
  };

  const solicitarCambioEstado = (especialidad: EspecialidadClinica) => {
    setConfirmEstado(especialidad);
  };

  const confirmarCambioEstado = () => {
    if (confirmEstado) {
      clinicaStore.toggleEstadoEspecialidad(confirmEstado.id);
    }
    setConfirmEstado(null);
  };

  const especialidadModalMedicos =
    especialidades.find((e) => e.id === modalMedicosId) ?? null;

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
          onAgregar={(medicoId) =>
            clinicaStore.asignarEspecialidadAMedico(
              medicoId,
              especialidadModalMedicos.id,
            )
          }
          onQuitar={(medicoId) =>
            clinicaStore.quitarEspecialidadDeMedico(
              medicoId,
              especialidadModalMedicos.id,
            )
          }
          onCerrar={() => setModalMedicosId(null)}
          vistaInicial="lista"
        />
      )}

      {confirmEstado && (
        <ModalConfirmarEstado
          especialidad={confirmEstado}
          onConfirmar={confirmarCambioEstado}
          onCerrar={() => setConfirmEstado(null)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">
              Gestión de especialidades
            </h2>
            <p className="fs-12 text-secondary mt-1 mb-0"></p>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setModal(null)}
              className="btn btn-primary btn-sm"
            >
              + Nueva especialidad
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Stats */}
          <div className="row row-cols-1 row-cols-sm-3 g-3 mb-4">
            <div className="col">
              <StatCard label="Especialidades" value={stats.total} />
            </div>
            <div className="col">
              <StatCard
                label="Activas"
                value={stats.activas}
                color="text-success"
              />
            </div>
            <div className="col">
              <StatCard
                label="Médicos asignados"
                value={stats.medicos}
                color="text-primary"
              />
            </div>
          </div>

          {/* Filtros + toggle vista */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <i
                className="bi bi-search text-secondary fs-6"
                aria-hidden="true"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar especialidad…"
                className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="form-select form-select-sm bg-soft"
              style={{ maxWidth: 220 }}
            >
              <option value="Todos">Todos los estados</option>
              <option>Activa</option>
              <option>Inactiva</option>
            </select>
            <div className="d-flex gap-1">
              <button
                onClick={() => setVista("grid")}
                className={`btn btn-sm d-flex align-items-center gap-1 ${vista === "grid" ? "btn-outline-primary" : "btn-outline-secondary"}`}
              >
                <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" />{" "}
                Cuadrícula
              </button>
              <button
                onClick={() => setVista("list")}
                className={`btn btn-sm d-flex align-items-center gap-1 ${vista === "list" ? "btn-outline-primary" : "btn-outline-secondary"}`}
              >
                <i className="bi bi-list-ul" aria-hidden="true" /> Lista
              </button>
            </div>
          </div>

          {filtradas.length === 0 && (
            <p className="py-5 text-center fs-6 text-secondary">
              No se encontraron especialidades.
            </p>
          )}

          {/* Vista cuadrícula */}
          {vista === "grid" && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {filtradas.map((e) => {
                const cantidadMedicos = medicosDe(e.id).length;
                return (
                  <div key={e.id} className="col">
                    <div
                      className={`position-relative bg-white border rounded-4 p-3 card-hover-primary ${e.estado === "Inactiva" ? "opacity-60" : ""}`}
                    >
                      <div className="position-absolute top-0 end-0 mt-3 me-3 d-flex gap-1">
                        <button
                          onClick={() => setModal(e)}
                          aria-label="Editar"
                          title="Editar"
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        >
                          <i
                            className="bi bi-pencil-square"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => solicitarCambioEstado(e)}
                          aria-label={
                            e.estado === "Activa" ? "Desactivar" : "Activar"
                          }
                          title={
                            e.estado === "Activa" ? "Desactivar" : "Activar"
                          }
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        >
                          <i
                            className={`bi ${e.estado === "Activa" ? "bi-lock-fill" : "bi-unlock-fill"}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                      <p className="fs-6 fw-medium text-dark mb-0 pe-5">
                        {e.nombre}
                      </p>
                      <div className="d-flex align-items-center gap-2 mt-1 mb-2">
                        <span
                          className={`badge-soft ${e.estado === "Activa" ? "badge-soft-green" : "badge-soft-gray"}`}
                        >
                          {e.estado}
                        </span>
                      </div>
                      <div className="d-flex gap-3 fs-12 text-secondary">
                        <button
                          type="button"
                          onClick={() => setModalMedicosId(e.id)}
                          title="Ver médicos asignados"
                          className="btn btn-link p-0 fs-12 text-secondary text-decoration-underline d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-people-fill" aria-hidden="true" />{" "}
                          {cantidadMedicos} médicos
                        </button>
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
              <div
                className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                style={{
                  letterSpacing: ".03em",
                  gridTemplateColumns: COLUMNAS_TABLA_ESPECIALIDADES,
                }}
              >
                <span>Especialidad</span>
                <span>Estado</span>
                <span>Médicos</span>
                <span>Acciones</span>
              </div>
              {filtradas.map((e) => {
                const cantidadMedicos = medicosDe(e.id).length;
                return (
                  <div
                    key={e.id}
                    className={`d-grid px-3 py-3 border-bottom align-items-center fs-6 hover-row ${e.estado === "Inactiva" ? "opacity-60" : ""}`}
                    style={{
                      gridTemplateColumns: COLUMNAS_TABLA_ESPECIALIDADES,
                    }}
                  >
                    <span className="fw-medium text-dark">{e.nombre}</span>
                    <span
                      className={`badge-soft w-fit-content ${e.estado === "Activa" ? "badge-soft-green" : "badge-soft-gray"}`}
                    >
                      {e.estado}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalMedicosId(e.id)}
                      title="Ver médicos asignados"
                      className="btn btn-link p-0 text-secondary text-decoration-underline text-start"
                    >
                      {cantidadMedicos}
                    </button>
                    <div className="d-flex gap-1">
                      <button
                        onClick={() => setModal(e)}
                        aria-label="Editar"
                        title="Editar"
                        className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                      >
                        <i className="bi bi-pencil-square" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => solicitarCambioEstado(e)}
                        aria-label={
                          e.estado === "Activa" ? "Desactivar" : "Activar"
                        }
                        title={e.estado === "Activa" ? "Desactivar" : "Activar"}
                        className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                      >
                        <i
                          className={`bi ${e.estado === "Activa" ? "bi-lock-fill" : "bi-unlock-fill"}`}
                          aria-hidden="true"
                        />
                      </button>
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

function StatCard({
  label,
  value,
  color = "text-dark",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-soft border rounded px-3 py-3">
      <p className={`fs-4 fw-medium mb-0 ${color}`}>{value}</p>
      <p className="fs-11 text-secondary mt-1 mb-0">{label}</p>
    </div>
  );
}
