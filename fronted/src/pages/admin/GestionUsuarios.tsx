import React, { useState, useMemo } from "react";
import type { EstadoUsuario } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore, type UsuarioClinica, type EspecialidadClinica } from "../../types/clinicaStore";
import { formatearCedula, formatearTelefono, esCorreoValido } from "../../utils/Formato";
import { validarNombre, validarCedula, validarTelefono, validarNombreUsuario, validarContrasena } from "../../utils/validaciones";

const ROL_COLOR: Record<string, string> = {
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
type FormUsuario = Omit<UsuarioClinica, "id" | "especialidadIds"> & { id?: number };

interface ModalUsuarioProps {
  usuario?: UsuarioClinica;
  rolesActivos: { IdRol: number; NombreRol: string }[];
  onGuardar: (form: FormUsuario & { contrasena?: string }) => Promise<void>;
  onCerrar: () => void;
}

interface ModalConfirmarEstadoUsuarioProps {
  usuario: UsuarioClinica;
  onConfirmar: () => void;
  onCerrar: () => void;
}

function nombreCompletoDe(u: Pick<UsuarioClinica, "nombre" | "apellido1" | "apellido2">): string {
  return `${u.nombre} ${u.apellido1} ${u.apellido2 ?? ""}`.trim();
}

// Junta los nombres de todas las especialidades de un médico, ej:
// "Cardiología/Urología". Si no es médico o no tiene ninguna, retorna "—".
function especialidadesDe(u: UsuarioClinica, especialidades: EspecialidadClinica[]): string {
  if (u.rol !== "Médico") return "—";
  const nombres = (u.especialidadIds ?? [])
    .map((id) => especialidades.find((e) => e.id === id)?.nombre)
    .filter((n): n is string => !!n);
  return nombres.length > 0 ? nombres.join("/") : "—";
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
            ¿Deseas {accion} a <strong>{nombreCompletoDe(usuario)}</strong>?
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
function ModalUsuario({ usuario, rolesActivos, onGuardar, onCerrar }: ModalUsuarioProps) {
  const esNuevo = !usuario?.id;

  const [form, setForm] = useState<FormUsuario>({
    nombre:        usuario?.nombre        ?? "",
    apellido1:     usuario?.apellido1     ?? "",
    apellido2:     usuario?.apellido2     ?? "",
    telefono:      usuario?.telefono      ?? "",
    correo:        usuario?.correo        ?? "",
    rol:           usuario?.rol           ?? "",
    estado:        usuario?.estado        ?? "Activo",
    ingreso:       usuario?.ingreso       ?? new Date().toLocaleDateString("es-CR"),
    iniciales:     usuario?.iniciales     ?? "",
    nombreUsuario: usuario?.nombreUsuario ?? "",
    ident:         usuario?.ident         ?? "",
    ...(usuario?.id ? { id: usuario.id } : {}),
  });
  const [contrasena, setContrasena] = useState<string>("");
  const [guardando, setGuardando]   = useState<boolean>(false);
  const [error, setError]           = useState<string>("");

  const handleChange = <K extends keyof FormUsuario>(campo: K, valor: FormUsuario[K]) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "nombre" || campo === "apellido1") {
        const nombre = campo === "nombre" ? (valor as string) : prev.nombre;
        const apellido1 = campo === "apellido1" ? (valor as string) : prev.apellido1;
        next.iniciales = `${nombre[0] ?? ""}${apellido1[0] ?? ""}`.toUpperCase();
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!validarNombre(form.nombre)) {
      setError("El nombre debe tener solo letras, entre 2 y 50 caracteres.");
      return;
    }
    if (!validarNombre(form.apellido1)) {
      setError("El primer apellido debe tener solo letras, entre 2 y 50 caracteres.");
      return;
    }
    if (!validarNombre(form.apellido2 ?? "")) {
      setError("El segundo apellido debe tener solo letras, entre 2 y 50 caracteres.");
      return;
    }
    if (!validarTelefono(form.telefono ?? "")) {
      setError("El teléfono debe tener el formato 8888-0000.");
      return;
    }
    if (!esCorreoValido(form.correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!validarNombreUsuario(form.nombreUsuario)) {
      setError("El usuario de acceso debe tener entre 3 y 30 caracteres (letras, números, puntos o guiones).");
      return;
    }
    if (!validarCedula(form.ident)) {
      setError("La cédula/identificación debe tener el formato 1-2345-6789.");
      return;
    }
    if (esNuevo && !validarContrasena(contrasena)) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    if (!form.rol) {
      setError("Selecciona un rol.");
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
      <div
        className="bg-white rounded-4 shadow w-100 d-flex flex-column"
        style={{ maxWidth: 448, maxHeight: "90vh" }}
      >
        {/* Header — fijo arriba */}
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Crear nuevo usuario" : "Editar usuario"}
          </h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        {/* Body — con scroll interno cuando el contenido no cabe */}
        <div className="p-4 d-flex flex-column gap-3 overflow-auto">
          <div className="row g-3">
            <div className="col-6">
              <Field label="Nombre">
                <input
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Primer apellido">
                <input
                  value={form.apellido1}
                  onChange={(e) => handleChange("apellido1", e.target.value)}
                  placeholder="Primer apellido"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <Field label="Segundo apellido">
                <input
                  value={form.apellido2 ?? ""}
                  onChange={(e) => handleChange("apellido2", e.target.value)}
                  placeholder="Segundo apellido"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
             <Field label="Teléfono">
                <input
                  value={form.telefono ?? ""}
                  onChange={(e) =>
                    handleChange("telefono", formatearTelefono(e.target.value))
                  }
                  placeholder="8888-0000"
                  inputMode="numeric"
                  maxLength={9}
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
            <div className="col-5">
              <div className="col-11">
              <Field label="Cédula / identificación">
                <input
                  value={form.ident}
                  onChange={(e) =>
                    handleChange("ident", formatearCedula(e.target.value))
                  }
                  placeholder="1-2345-6789"
                  inputMode="numeric"
                  maxLength={11}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
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
              onChange={(e) => handleChange("rol", e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="">Selecciona un rol…</option>
              {rolesActivos.map((r) => (
                <option key={r.IdRol} value={r.NombreRol}>{r.NombreRol}</option>
              ))}
            </select>
          </Field>

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

        {/* Footer — fijo abajo */}
        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2 flex-shrink-0">
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
  const { usuarios, especialidades, roles, cargando } = useClinicaStore();
  const rolesActivos = useMemo(() => roles.filter((r) => r.Estado !== "I"), [roles]);

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
  }), [usuarios]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return usuarios.filter((u) =>
      (nombreCompletoDe(u).toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)) &&
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
        apellido1: form.apellido1,
        apellido2: form.apellido2 || undefined,
        telefono: form.telefono || undefined,
        correo: form.correo,
        rol: form.rol,
        estado: form.estado,
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

  return (
    <>
      {modalUsuario !== undefined && (
        <ModalUsuario
          usuario={modalUsuario ?? undefined}
          rolesActivos={rolesActivos}
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
              <div className="row row-cols-1 row-cols-sm-3 g-3 mb-4">
                <div className="col"><StatCard label="Total usuarios"  value={stats.total} /></div>
                <div className="col"><StatCard label="Activos"         value={stats.activos}   color="text-success" /></div>
                <div className="col"><StatCard label="Inactivos"       value={stats.inactivos} color="text-secondary" /></div>
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
                  {roles.map((r) => (
                    <option key={r.IdRol} value={r.NombreRol}>{r.NombreRol}</option>
                  ))}
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

                {paginados.map((u, i) => {
                  const especialidadTexto = especialidadesDe(u, especialidades);
                  return (
                    <div
                      key={u.id}
                      className={`grid-usuarios px-3 py-3 border-bottom align-items-center fs-6 hover-row ${u.estado === "Inactivo" ? "opacity-60" : ""}`}
                      style={{ gridTemplateColumns: COLUMNAS_TABLA_USUARIOS }}
                    >
                      <div className={`avatar-circle ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {u.iniciales}
                      </div>
                      <div>
                        <p className="fw-medium text-dark mb-0">{nombreCompletoDe(u)}</p>
                        <p className="fs-11 text-secondary mb-0">Desde {u.ingreso}</p>
                      </div>
                      <p className="text-secondary fs-12 text-truncate mb-0">{u.correo}</p>
                      <div>
                        <span className={`badge-soft ${ROL_COLOR[u.rol] ?? "badge-soft-gray"}`}>
                          {u.rol}
                        </span>
                      </div>
                      <div>
                        {especialidadTexto === "—" ? (
                          <span className="text-secondary fs-12">—</span>
                        ) : (
                          <span className="badge-soft badge-soft-amber">{especialidadTexto}</span>
                        )}
                      </div>
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
                  );
                })}
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