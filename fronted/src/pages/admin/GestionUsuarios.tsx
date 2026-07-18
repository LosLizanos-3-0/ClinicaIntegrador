/**
 * GestionUsuarios.tsx
 * RF08 – Gestión de Usuarios
 *   ✔ Crear usuarios
 *   ✔ Editar usuarios
 *   ✔ Asignar roles
 *   ✔ Asignar especialidad (solo rol "Médico")
 *   ✔ Desactivar / Activar usuarios (con confirmación)
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3 · Bootstrap Icons 1.11+
 * Agregar en el <head> del proyecto (si no está ya):
 *   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
 * (usa clases auxiliares definidas en clinica-admin.css)
 *
 * Conectado al backend real vía clinicaStore.ts / usuario.service.ts.
 */

import React, { useState, useMemo } from "react";
import type { RolUsuario, EstadoUsuario } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore, type UsuarioClinica } from "../../types/clinicaStore";

type RolDisponible = Exclude<RolUsuario, "Enfermera">;

const ROLES: RolDisponible[] = ["Administrador", "Médico", "Recepcionista", "Farmacéutico"];

const ROL_COLOR: Record<RolDisponible, string> = {
  Administrador: "badge-soft-purple",
  Médico:        "badge-soft-emerald",
  Recepcionista: "badge-soft-blue",
  Farmacéutico:  "badge-soft-teal",
};

const AVATAR_COLORS: string[] = [
  "avatar-blue",
  "avatar-emerald",
  "avatar-amber",
  "avatar-pink",
  "avatar-purple",
  "avatar-teal",
];

const COLUMNAS_TABLA_USUARIOS = "44px 1.7fr 1.8fr 0.9fr 1.1fr 0.8fr 0.9fr";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormUsuario = Omit<UsuarioClinica, "id"> & { id?: number };

interface ModalUsuarioProps {
  usuario?: UsuarioClinica;
  onGuardar: (form: FormUsuario & { contrasena?: string }) => Promise<void>;
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
            ¿Deseas {accion} a <strong>{usuario.nombre}</strong>?
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

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
function ModalUsuario({ usuario, onGuardar, onCerrar }: ModalUsuarioProps) {
  const esNuevo = !usuario?.id;
  const { especialidades } = useClinicaStore();
  const especialidadesActivas = especialidades.filter((e) => e.estado === "Activa");

  const [form, setForm] = useState<FormUsuario>({
    nombre:         usuario?.nombre         ?? "",
    correo:         usuario?.correo         ?? "",
    rol:            usuario?.rol            ?? "Médico",
    estado:         usuario?.estado         ?? "Activo",
    ingreso:        usuario?.ingreso        ?? new Date().toLocaleDateString("es-CR"),
    iniciales:      usuario?.iniciales      ?? "",
    especialidadId: usuario?.especialidadId,
    nombreUsuario:  usuario?.nombreUsuario  ?? "",
    ident:          usuario?.ident          ?? "",
    ...(usuario?.id ? { id: usuario.id } : {}),
  });
  const [contrasena, setContrasena] = useState<string>("");
  const [guardando, setGuardando]   = useState<boolean>(false);
  const [error, setError]           = useState<string>("");

  const handleChange = <K extends keyof FormUsuario>(campo: K, valor: FormUsuario[K]) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "nombre") {
        const partes = (valor as string).trim().split(" ").filter(Boolean);
        next.iniciales = partes.map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
      }
      if (campo === "rol" && valor !== "Médico") {
        next.especialidadId = undefined;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.correo.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    if (!form.nombreUsuario.trim() || !form.ident.trim()) {
      setError("Usuario de acceso y cédula/identificación son obligatorios.");
      return;
    }
    if (esNuevo && !contrasena.trim()) {
      setError("La contraseña es obligatoria al crear un usuario.");
      return;
    }
    if (form.rol === "Médico" && !form.especialidadId) {
      setError("Selecciona una especialidad para el médico.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar(esNuevo ? { ...form, contrasena } : form);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el usuario. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 448 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Crear nuevo usuario" : "Editar usuario"}
          </h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <Field label="Nombre completo">
            <input
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Nombre completo"
              className="form-control form-control-sm"
            />
          </Field>

          <Field label="Correo electrónico">
            <input
              type="email"
              value={form.correo}
              onChange={(e) => handleChange("correo", e.target.value)}
              placeholder="correo@clinica.com"
              className="form-control form-control-sm"
            />
          </Field>

          <div className="row g-3">
            <div className="col-6">
              <Field label="Usuario de acceso">
                <input
                  value={form.nombreUsuario}
                  onChange={(e) => handleChange("nombreUsuario", e.target.value)}
                  placeholder="jvenegas"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Cédula / identificación">
                <input
                  value={form.ident}
                  onChange={(e) => handleChange("ident", e.target.value)}
                  placeholder="1-2345-6789"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          {esNuevo && (
            <Field label="Contraseña temporal">
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Contraseña inicial"
                className="form-control form-control-sm"
              />
            </Field>
          )}

          <Field label="Rol">
            <select
              value={form.rol}
              onChange={(e) => handleChange("rol", e.target.value as RolUsuario)}
              className="form-select form-select-sm"
            >
              {ROLES.map((r) => <option key={r}>{r}</option>)}
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

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm" disabled={guardando}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? "Guardando…" : esNuevo ? "Crear usuario" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionUsuarios() {
  const { usuarios, especialidades, cargando } = useClinicaStore();

  const [busqueda, setBusqueda]         = useState<string>("");
  const [filtroRol, setFiltroRol]       = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [pagina, setPagina]             = useState<number>(1);
  const [modalUsuario, setModalUsuario] = useState<UsuarioClinica | null | undefined>(undefined);
  const [confirmEstadoUsuario, setConfirmEstadoUsuario] = useState<UsuarioClinica | null>(null);
  const POR_PAGINA = 5;

  const stats = useMemo(() => ({
    total:     usuarios.length,
    activos:   usuarios.filter((u) => u.estado === "Activo").length,
    inactivos: usuarios.filter((u) => u.estado === "Inactivo").length,
    admins:    usuarios.filter((u) => u.rol === "Administrador").length,
  }), [usuarios]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return usuarios.filter((u) =>
      (u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)) &&
      (filtroRol === "Todos" || u.rol === filtroRol) &&
      (filtroEstado === "Todos" || u.estado === filtroEstado)
    );
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const guardarUsuario = async (form: FormUsuario & { contrasena?: string }) => {
    if (form.id) {
      await clinicaStore.actualizarUsuario(form as UsuarioClinica);
    } else {
      await clinicaStore.crearUsuario({
        nombre: form.nombre,
        correo: form.correo,
        rol: form.rol,
        estado: form.estado,
        especialidadId: form.especialidadId,
        nombreUsuario: form.nombreUsuario,
        ident: form.ident,
        contrasena: form.contrasena ?? "",
      });
    }
    setModalUsuario(undefined);
  };

  const solicitarCambioEstado = (usuario: UsuarioClinica) => {
    setConfirmEstadoUsuario(usuario);
  };

  const confirmarCambioEstado = async () => {
    if (confirmEstadoUsuario) {
      await clinicaStore.toggleEstadoUsuario(confirmEstadoUsuario.id);
    }
    setConfirmEstadoUsuario(null);
  };

  const especialidadDe = (u: UsuarioClinica): string => {
    if (u.rol !== "Médico") return "—";
    const esp = especialidades.find((e) => e.id === u.especialidadId);
    return esp ? esp.nombre : "—";
  };

  return (
    <>
      {modalUsuario !== undefined && (
        <ModalUsuario
          usuario={modalUsuario ?? undefined}
          onGuardar={guardarUsuario}
          onCerrar={() => setModalUsuario(undefined)}
        />
      )}

      {confirmEstadoUsuario && (
        <ModalConfirmarEstadoUsuario
          usuario={confirmEstadoUsuario}
          onConfirmar={confirmarCambioEstado}
          onCerrar={() => setConfirmEstadoUsuario(null)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
           <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de usuarios</h2>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setModalUsuario(null)}
              className="btn btn-primary btn-sm"
            >
              + Nuevo usuario
            </button>
          </div>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando usuarios…</p>
          ) : (
            <>
              {/* Stats */}
              <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
                <div className="col"><StatCard label="Total usuarios"  value={stats.total} /></div>
                <div className="col"><StatCard label="Activos"         value={stats.activos}   color="text-success" /></div>
                <div className="col"><StatCard label="Inactivos"       value={stats.inactivos} color="text-secondary" /></div>
                <div className="col"><StatCard label="Administradores" value={stats.admins}    color="text-purple" /></div>
              </div>

              {/* Filtros */}
              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <i className="bi bi-search text-secondary fs-6" aria-hidden="true" />
                  <input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                    placeholder="Buscar por nombre o correo…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
                <select
                  value={filtroRol}
                  onChange={(e) => { setFiltroRol(e.target.value); setPagina(1); }}
                  className="form-select form-select-sm bg-soft"
                  style={{ maxWidth: 220 }}
                >
                  <option value="Todos">Todos los roles</option>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <select
                  value={filtroEstado}
                  onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
                  className="form-select form-select-sm bg-soft"
                  style={{ maxWidth: 220 }}
                >
                  <option value="Todos">Todos los estados</option>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </div>

              {/* Tabla */}
              <div className="border rounded overflow-hidden">
                <div
                  className="grid-usuarios d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                  style={{ letterSpacing: ".03em", gridTemplateColumns: COLUMNAS_TABLA_USUARIOS }}
                >
                  <span /><span>Usuario</span><span>Correo</span><span>Rol</span><span>Especialidad</span><span>Estado</span><span className="text-center">Acciones</span>
                </div>

                {paginados.length === 0 && (
                  <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron usuarios.</p>
                )}

                {paginados.map((u, i) => (
                  <div
                    key={u.id}
                    className={`grid-usuarios px-3 py-3 border-bottom align-items-center fs-6 hover-row ${u.estado === "Inactivo" ? "opacity-60" : ""}`}
                    style={{ gridTemplateColumns: COLUMNAS_TABLA_USUARIOS }}
                  >
                    <div className={`avatar-circle ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {u.iniciales}
                    </div>
                    <div>
                      <p className="fw-medium text-dark mb-0">{u.nombre}</p>
                      <p className="fs-11 text-secondary mb-0">Desde {u.ingreso}</p>
                    </div>
                    <p className="text-secondary fs-12 text-truncate mb-0">{u.correo}</p>
                    <div>
                      <span className={`badge-soft ${ROL_COLOR[u.rol as RolDisponible] ?? "badge-soft-gray"}`}>
                        {u.rol}
                      </span>
                    </div>
                    <p className="text-secondary fs-12 mb-0">{especialidadDe(u)}</p>
                    <div>
                      <span className={`badge-soft ${u.estado === "Activo" ? "badge-soft-green" : "badge-soft-gray"}`}>
                        {u.estado}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <IconBtn label="Editar" onClick={() => setModalUsuario(u)}>
                        <i className="bi bi-pencil-square" aria-hidden="true" />
                      </IconBtn>
                      <IconBtn
                        label={u.estado === "Activo" ? "Desactivar" : "Activar"}
                        onClick={() => solicitarCambioEstado(u)}
                      >
                        <i className={`bi ${u.estado === "Activo" ? "bi-lock-fill" : "bi-unlock-fill"}`} aria-hidden="true" />
                      </IconBtn>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              <div className="d-flex align-items-center justify-content-between mt-3 fs-12 text-secondary">
                <span>
                  {filtrados.length === 0 ? "0" : `${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, filtrados.length)}`} de {filtrados.length} usuarios
                </span>
                <div className="d-flex gap-1">
                  <PagBtn onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>‹</PagBtn>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                    <PagBtn key={p} active={p === pagina} onClick={() => setPagina(p)}>{p}</PagBtn>
                  ))}
                  <PagBtn onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>›</PagBtn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function StatCard({ label, value, color = "text-dark" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-soft border rounded px-3 py-3">
      <p className={`fs-4 fw-medium mb-0 ${color}`}>{value}</p>
      <p className="fs-11 text-secondary mt-1 mb-0">{label}</p>
    </div>
  );
}

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

function PagBtn({
  children, onClick, active = false, disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
    >
      {children}
    </button>
  );
}