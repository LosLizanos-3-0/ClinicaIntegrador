/**
 * GestionRoles.tsx
 * RF08 – Gestión de Roles
 *   ✔ Ver usuarios agrupados por rol
 *   ✔ Editar usuario (rol, especialidad, estado) desde la vista de roles
 *   ✔ Activar / Desactivar usuarios (con confirmación)
 *   ✔ Crear roles reales en el backend (tabla Rol)
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3 · Bootstrap Icons 1.11+
 * Agregar en el <head> del proyecto:
 *   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
 * (usa clases auxiliares definidas en clinica-admin.css)
 *
 * Los roles ya NO son un catálogo mock local: vienen de `clinicaStore.ts`
 * (tabla Rol en SQL Server, vía rol.service.ts). Al crear un rol aquí con
 * "+ Crear rol", queda disponible automáticamente en Gestión de usuarios
 * para asignarlo a un usuario nuevo o existente.
 *
 * IMPORTANTE: para que la asignación de especialidad funcione (solo médicos)
 * y para que las citas/reportes filtren correctamente, el rol debe llamarse
 * exactamente "Médico" (con tilde) al crearlo — el sistema compara el
 * nombre del rol como texto exacto en varias pantallas.
 */

import React, { useEffect, useMemo, useState } from "react";
import type { EstadoUsuario } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore, type UsuarioClinica } from "../../types/clinicaStore";

// Ícono + descripción "bonita" para los roles que el sistema ya conoce.
// Un rol creado por el admin con otro nombre usa el ícono/descripción
// genéricos definidos más abajo (ICONO_ROL_PERSONALIZADO / DESCRIPCION_GENERICA).
const ROLES_INFO: Record<string, { icono: string; descripcion: string }> = {
  Administrador: { icono: "shield-lock-fill",    descripcion: "Control total del sistema" },
  Médico:        { icono: "heart-pulse-fill",    descripcion: "Gestión de pacientes y citas" },
  Recepcionista: { icono: "calendar-check-fill", descripcion: "Agenda y atención al paciente" },
  Farmacéutico:  { icono: "capsule",             descripcion: "Gestión de recetas y farmacia" },
};

const ICONO_ROL_PERSONALIZADO = "person-badge-fill";
const DESCRIPCION_GENERICA = "Rol personalizado";

const AVATAR_COLORS: string[] = [
  "avatar-blue",
  "avatar-emerald",
  "avatar-amber",
  "avatar-pink",
  "avatar-purple",
  "avatar-teal",
];

// 44px avatar · Usuario · Correo · Especialidad · Estado · Acciones
const COLUMNAS_TABLA_ROLES = "44px 1.7fr 1.8fr 1.1fr 1fr 0.9fr";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormUsuario = Omit<UsuarioClinica, "id"> & { id: number };

interface RolCatalogo {
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
  esSistema: boolean;
}

interface ModalUsuarioProps {
  usuario: UsuarioClinica;
  rolesActivos: { IdRol: number; NombreRol: string }[];
  onGuardar: (form: FormUsuario) => Promise<void>;
  onCerrar: () => void;
}

interface ModalRolProps {
  onGuardar: (nombre: string, cita: boolean) => Promise<void>;
  onCerrar: () => void;
}

interface ModalConfirmarEstadoUsuarioProps {
  usuario: UsuarioClinica;
  onConfirmar: () => void;
  onCerrar: () => void;
}

// ─── Modal: confirmar activar/desactivar usuario ──────────────────────────────
function ModalConfirmarEstadoUsuario({ usuario, onConfirmar, onCerrar }: ModalConfirmarEstadoUsuarioProps) {
  const vaADesactivar = usuario.estado === "Activo";
  const accion = vaADesactivar ? "desactivar" : "activar";

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1070 }}>
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 420 }}>
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
            {vaADesactivar ? "¿Desactivar usuario?" : "¿Activar usuario?"}
          </h3>

          <p className="fs-6 text-secondary mb-0">
            ¿Deseas {accion} a <strong>{usuario.nombre} {usuario.apellido1}</strong>?
            {vaADesactivar && (
              <> No podrá iniciar sesión ni realizar acciones en el sistema mientras esté inactivo.</>
            )}
          </p>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">
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

// ─── Modal Nuevo rol (ahora persiste en la tabla Rol real) ────────────────────
function ModalRol({ onGuardar, onCerrar }: ModalRolProps) {
  const [nombre, setNombre]     = useState("");
  const [cita, setCita]         = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      setError("El nombre del rol es obligatorio.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar(nombre.trim(), cita);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al crear el rol. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 384 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">Nuevo rol</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="btn btn-link text-secondary fs-5 text-decoration-none p-0">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-12 text-secondary mb-1">Nombre del rol</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Médico"
              className="form-control form-control-sm"
            />
            <p className="fs-11 text-secondary mt-1 mb-0">
              Usa exactamente <strong>"Médico"</strong> (con tilde) si este rol es para personal médico,
              así la asignación de especialidad funciona correctamente.
            </p>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              id="rol-cita"
              checked={cita}
              onChange={(e) => setCita(e.target.checked)}
              className="form-check-input"
            />
            <label htmlFor="rol-cita" className="form-check-label fs-12 text-secondary">
              Este rol atiende citas médicas
            </label>
          </div>

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}
        </div>
        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm" disabled={guardando}>Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? "Creando…" : "Crear rol"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Editar usuario ──────────────────────────────────────────────────────
function ModalUsuario({ usuario, rolesActivos, onGuardar, onCerrar }: ModalUsuarioProps) {
  const { especialidades } = useClinicaStore();
  const especialidadesActivas = especialidades.filter((e) => e.estado === "Activa");

  const [form, setForm] = useState<FormUsuario>({ ...usuario });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = <K extends keyof FormUsuario>(campo: K, valor: FormUsuario[K]) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "nombre" || campo === "apellido1") {
        const nombre = campo === "nombre" ? (valor as string) : prev.nombre;
        const apellido1 = campo === "apellido1" ? (valor as string) : prev.apellido1;
        next.iniciales = `${nombre[0] ?? ""}${apellido1[0] ?? ""}`.toUpperCase();
      }
      if (campo === "rol" && valor !== "Médico") {
        next.especialidadId = undefined;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.apellido1.trim() || !form.correo.trim()) {
      setError("Nombre, primer apellido y correo son obligatorios.");
      return;
    }
    if (!form.rol) {
      setError("Selecciona un rol.");
      return;
    }
    if (form.rol === "Médico" && !form.especialidadId) {
      setError("Selecciona una especialidad para el médico.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar(form);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el usuario. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100 d-flex flex-column"
        style={{ maxWidth: 448, maxHeight: "90vh" }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0">
          <h3 className="fs-6 fw-medium text-dark mb-0">Editar usuario</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 d-flex flex-column gap-3 overflow-auto">
          <div className="row g-3">
            <div className="col-6">
              <Field label="Nombre">
                <input
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Primer apellido">
                <input
                  value={form.apellido1}
                  onChange={(e) => handleChange("apellido1", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <Field label="Segundo apellido (opcional)">
                <input
                  value={form.apellido2 ?? ""}
                  onChange={(e) => handleChange("apellido2", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Teléfono (opcional)">
                <input
                  value={form.telefono ?? ""}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <Field label="Correo electrónico">
            <input
              type="email"
              value={form.correo}
              onChange={(e) => handleChange("correo", e.target.value)}
              className="form-control form-control-sm"
            />
          </Field>

          <Field label="Rol">
            <select
              value={form.rol}
              onChange={(e) => handleChange("rol", e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="">Selecciona un rol…</option>
              {rolesActivos.map((r) => (
                <option key={r.IdRol} value={r.NombreRol}>{r.NombreRol}</option>
              ))}
            </select>
          </Field>

          {form.rol === "Médico" && (
            <Field label="Especialidad">
              <select
                value={form.especialidadId ?? ""}
                onChange={(e) => handleChange("especialidadId", e.target.value ? Number(e.target.value) : undefined)}
                className="form-select form-select-sm"
              >
                <option value="">Selecciona una especialidad…</option>
                {especialidadesActivas.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
              {especialidadesActivas.length === 0 && (
                <p className="fs-11 text-secondary mt-1 mb-0">
                  No hay especialidades activas registradas. Crea una en "Gestión de especialidades" primero.
                </p>
              )}
            </Field>
          )}

          <Field label="Estado">
            <select
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value as EstadoUsuario)}
              className="form-select form-select-sm"
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </Field>

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2 flex-shrink-0">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm" disabled={guardando}>Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionRoles() {
  const { usuarios, roles, cargando } = useClinicaStore();

  const [rolActual, setRolActual]       = useState<string>("");
  const [busqueda, setBusqueda]         = useState<string>("");
  const [modalUsuario, setModalUsuario] = useState<UsuarioClinica | undefined>(undefined);
  const [modalRolAbierto, setModalRolAbierto] = useState<boolean>(false);
  const [confirmEstadoUsuario, setConfirmEstadoUsuario] = useState<UsuarioClinica | null>(null);

  const rolesActivos = useMemo(() => roles.filter((r) => r.Estado !== "I"), [roles]);

  const catalogoRoles: RolCatalogo[] = useMemo(
    () =>
      roles.map((r) => {
        const info = ROLES_INFO[r.NombreRol];
        return {
          id: r.IdRol,
          nombre: r.NombreRol,
          icono: info?.icono ?? ICONO_ROL_PERSONALIZADO,
          descripcion: info?.descripcion ?? DESCRIPCION_GENERICA,
          esSistema: !!info,
        };
      }),
    [roles]
  );

  // Selecciona automáticamente el primer rol disponible en cuanto carguen
  useEffect(() => {
    if (!rolActual && catalogoRoles.length > 0) {
      setRolActual(catalogoRoles[0].nombre);
    }
  }, [catalogoRoles, rolActual]);

  const conteoPorRol = useMemo(() => {
    const conteo: Record<string, number> = {};
    catalogoRoles.forEach((r) => { conteo[r.nombre] = usuarios.filter((u) => u.rol === r.nombre).length; });
    return conteo;
  }, [usuarios, catalogoRoles]);

  const rolActualInfo = catalogoRoles.find((r) => r.nombre === rolActual) ?? catalogoRoles[0];

  const usuariosDelRol = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((u) =>
      u.rol === rolActual &&
      (`${u.nombre} ${u.apellido1}`.toLowerCase().includes(termino) || u.correo.toLowerCase().includes(termino))
    );
  }, [usuarios, rolActual, busqueda]);

  const guardarUsuario = async (form: FormUsuario) => {
    await clinicaStore.actualizarUsuario(form as UsuarioClinica);
    setModalUsuario(undefined);
  };

  const solicitarCambioEstadoUsuario = (usuario: UsuarioClinica) => {
    setConfirmEstadoUsuario(usuario);
  };

  const confirmarCambioEstadoUsuario = async () => {
    if (confirmEstadoUsuario) {
      await clinicaStore.toggleEstadoUsuario(confirmEstadoUsuario.id);
    }
    setConfirmEstadoUsuario(null);
  };

  const crearRol = async (nombre: string, cita: boolean) => {
    await clinicaStore.crearRol(nombre, cita);
    setRolActual(nombre);
    setModalRolAbierto(false);
  };

  return (
    <>
      {modalRolAbierto && (
        <ModalRol onGuardar={crearRol} onCerrar={() => setModalRolAbierto(false)} />
      )}

      {modalUsuario && (
        <ModalUsuario
          usuario={modalUsuario}
          rolesActivos={rolesActivos}
          onGuardar={guardarUsuario}
          onCerrar={() => setModalUsuario(undefined)}
        />
      )}

      {confirmEstadoUsuario && (
        <ModalConfirmarEstadoUsuario
          usuario={confirmEstadoUsuario}
          onConfirmar={confirmarCambioEstadoUsuario}
          onCerrar={() => setConfirmEstadoUsuario(null)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark mb-0">Gestión de roles</h2>
          <button onClick={() => setModalRolAbierto(true)} className="btn btn-primary btn-sm">
            + Crear rol
          </button>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando roles…</p>
          ) : catalogoRoles.length === 0 ? (
            <div className="bg-soft border rounded p-4 text-center">
              <p className="fs-6 text-secondary mb-0">
                Aún no hay roles registrados. Crea el primero con "+ Crear rol".
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {/* Lista de roles */}
              <div className="col-12 col-lg-3" style={{ maxWidth: 300 }}>
                <p className="fs-11 text-uppercase text-secondary fw-medium mb-2" style={{ letterSpacing: ".03em" }}>Roles del sistema</p>
                <div className="d-flex flex-column gap-2">
                  {catalogoRoles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setRolActual(r.nombre); setBusqueda(""); }}
                      className={`text-start px-3 py-3 rounded border bg-white ${
                        r.nombre === rolActual ? "border-primary-subtle bg-primary bg-opacity-10" : "hover-row"
                      }`}
                    >
                      <p className={`fs-6 fw-medium d-flex align-items-center gap-2 mb-0 ${r.nombre === rolActual ? "text-primary" : "text-dark"}`}>
                        <i className={`bi bi-${r.icono}`} aria-hidden="true" /> {r.nombre}
                      </p>
                      <p className="fs-11 text-secondary mt-1 mb-0">{r.descripcion}</p>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="badge-soft badge-soft-gray fw-medium">
                          {conteoPorRol[r.nombre] ?? 0} usuarios
                        </span>
                        {!r.esSistema && (
                          <span className="badge-soft badge-soft-gray fw-medium">Personalizado</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel de usuarios del rol */}
              <div className="col-12 col-lg">
                <div className="bg-soft border rounded px-3 py-3 mb-3">
                  <p className="fs-6 fw-medium text-dark mb-0">{rolActualInfo?.nombre}</p>
                  <p className="fs-11 text-secondary mt-1 mb-0">
                    {conteoPorRol[rolActual] ?? 0} usuarios · {rolActualInfo?.descripcion}
                  </p>
                </div>

                {/* Buscador */}
                <div className="input-group input-group-sm mb-3" style={{ maxWidth: 320 }}>
                  <span className="input-group-text bg-white text-secondary">
                    <i className="bi bi-search" aria-hidden="true" />
                  </span>
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o correo..."
                    className="form-control"
                  />
                </div>

                {/* Tabla de usuarios registrados */}
                <div className="border rounded overflow-hidden">
                  <div
                    className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                    style={{ letterSpacing: ".03em", gridTemplateColumns: COLUMNAS_TABLA_ROLES }}
                  >
                    <span /><span>Usuario</span><span>Correo</span><span>Especialidad</span><span>Estado</span><span className="text-center">Acciones</span>
                  </div>

                  {usuariosDelRol.length === 0 ? (
                    <div className="px-3 py-5 text-center text-secondary">
                      <i className="bi bi-people fs-3 d-block mb-2" aria-hidden="true" />
                      <p className="fs-12 mb-0">No hay usuarios registrados con este rol.</p>
                    </div>
                  ) : (
                    usuariosDelRol.map((u, i) => (
                      <div
                        key={u.id}
                        className={`d-grid px-3 py-3 border-bottom align-items-center fs-6 hover-row ${u.estado === "Inactivo" ? "opacity-60" : ""}`}
                        style={{ gridTemplateColumns: COLUMNAS_TABLA_ROLES }}
                      >
                        <div className={`avatar-circle ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {u.iniciales}
                        </div>
                        <div>
                          <p className="fw-medium text-dark mb-0">{u.nombre} {u.apellido1}</p>
                          <p className="fs-11 text-secondary mb-0">Desde {u.ingreso}</p>
                        </div>
                        <p className="text-secondary fs-12 text-truncate mb-0">{u.correo}</p>
                        <p className="text-secondary fs-12 mb-0">—</p>
                        <div>
                          <span className={`badge-soft ${u.estado === "Activo" ? "badge-soft-green" : "badge-soft-gray"}`}>
                            {u.estado}
                          </span>
                        </div>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <IconBtn label="Editar usuario" onClick={() => setModalUsuario(u)}>
                            <i className="bi bi-pencil-square" aria-hidden="true" />
                          </IconBtn>
                          <IconBtn
                            label={u.estado === "Activo" ? "Desactivar usuario" : "Activar usuario"}
                            onClick={() => solicitarCambioEstadoUsuario(u)}
                          >
                            <i className={`bi ${u.estado === "Activo" ? "bi-lock-fill" : "bi-unlock-fill"}`} aria-hidden="true" />
                          </IconBtn>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label fs-12 text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({
  children, label, onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
    >
      {children}
    </button>
  );
}