import React, { useMemo, useState } from "react";
import type { EstadoUsuario } from "../../types/clinica.types";
import {
  clinicaStore,
  useClinicaStore,
  type UsuarioClinica,
  type EspecialidadClinica,
} from "../../types/clinicaStore";
import type { RolBD } from "../../services/rol.service";
import { formatearCedula, formatearTelefono } from "../../utils/Formato";
import {
  validarNombre,
  validarCedula,
  validarTelefono,
  validarNombreUsuario,
  validarContrasena,
} from "../../utils/validaciones";
import { esCorreoValido } from "../../utils/Formato";

// Ícono + descripción "bonita" para los roles que el sistema ya conoce.
const ROLES_INFO: Record<string, { icono: string; descripcion: string }> = {
  Administrador: {
    icono: "shield-lock-fill",
    descripcion: "Control total del sistema",
  },
  Médico: {
    icono: "heart-pulse-fill",
    descripcion: "Gestión de pacientes y citas",
  },
  Recepcionista: {
    icono: "calendar-check-fill",
    descripcion: "Agenda y atención al paciente",
  },
  Farmacéutico: {
    icono: "capsule",
    descripcion: "Gestión de recetas y farmacia",
  },
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
type FormUsuario = Omit<UsuarioClinica, "id" | "especialidadIds"> & {
  id?: number;
};

interface RolCatalogo {
  id: number;
  nombre: string;
  cita: boolean;
  estado: "A" | "I";
  icono: string;
  descripcion: string;
  esSistema: boolean;
}

interface ModalUsuarioProps {
  usuario?: UsuarioClinica;
  rolesActivos: { IdRol: number; NombreRol: string }[];
  onGuardar: (form: FormUsuario & { contrasena?: string }) => Promise<void>;
  onCerrar: () => void;
}

interface ModalEditarRolProps {
  rol: RolBD;
  onGuardar: (
    nombre: string,
    cita: boolean,
    estado: "A" | "I",
  ) => Promise<void>;
  onCerrar: () => void;
}

interface ModalConfirmarEstadoUsuarioProps {
  usuario: UsuarioClinica;
  onConfirmar: () => void;
  onCerrar: () => void;
}

interface ModalConfirmarEstadoRolProps {
  rol: RolBD;
  onConfirmar: () => void;
  onCerrar: () => void;
}

function nombreCompletoDe(
  u: Pick<UsuarioClinica, "nombre" | "apellido1" | "apellido2">,
): string {
  return `${u.nombre} ${u.apellido1} ${u.apellido2 ?? ""}`.trim();
}

// Junta los nombres de todas las especialidades de un médico, ej:
// "Cardiología/Urología". Si no es médico o no tiene ninguna, retorna "—".
function especialidadesDe(
  u: UsuarioClinica,
  especialidades: EspecialidadClinica[],
): string {
  if (u.rol !== "Médico") return "—";
  const nombres = (u.especialidadIds ?? [])
    .map((id) => especialidades.find((e) => e.id === id)?.nombre)
    .filter((n): n is string => !!n);
  return nombres.length > 0 ? nombres.join("/") : "—";
}

// ─── Modal: confirmar activar/desactivar usuario ──────────────────────────────
function ModalConfirmarEstadoUsuario({
  usuario,
  onConfirmar,
  onCerrar,
}: ModalConfirmarEstadoUsuarioProps) {
  const vaADesactivar = usuario.estado === "Activo";
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
            {vaADesactivar ? "¿Desactivar usuario?" : "¿Activar usuario?"}
          </h3>

          <p className="fs-6 text-secondary mb-0">
            ¿Deseas {accion} a <strong>{nombreCompletoDe(usuario)}</strong>?
            {vaADesactivar && (
              <>
                {" "}
                No podrá iniciar sesión ni realizar acciones en el sistema
                mientras esté inactivo.
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

// ─── Modal: confirmar activar/desactivar rol ──────────────────────────────────
function ModalConfirmarEstadoRol({
  rol,
  onConfirmar,
  onCerrar,
}: ModalConfirmarEstadoRolProps) {
  const vaADesactivar = (rol.Estado ?? "A") === "A";
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
            {vaADesactivar ? "¿Desactivar rol?" : "¿Activar rol?"}
          </h3>

          <p className="fs-6 text-secondary mb-0">
            ¿Deseas {accion} el rol <strong>{rol.NombreRol}</strong>?
            {vaADesactivar && (
              <>
                {" "}
                No aparecerá disponible para asignar a nuevos usuarios mientras
                esté inactivo.
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

// ─── Modal Editar rol ──────────────────────────────────────────────────────────
function ModalEditarRol({ rol, onGuardar, onCerrar }: ModalEditarRolProps) {
  const [nombre, setNombre] = useState(rol.NombreRol);
  const [cita, setCita] = useState(rol.cita);
  const [estado, setEstado] = useState<"A" | "I">(rol.Estado ?? "A");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!validarNombre(nombre)) {
      setError(
        "El nombre del rol debe tener solo letras, entre 2 y 50 caracteres.",
      );
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar(nombre.trim(), cita, estado);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al guardar los cambios. Intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: 384 }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">Editar rol</h3>
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
              Nombre del rol
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Médico"
              className="form-control form-control-sm"
            />
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "A" | "I")}
              className="form-select form-select-sm"
            >
              <option value="A">Activo</option>
              <option value="I">Inactivo</option>
            </select>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              id="rol-cita-editar"
              checked={cita}
              onChange={(e) => setCita(e.target.checked)}
              className="form-check-input"
            />
            <label
              htmlFor="rol-cita-editar"
              className="form-check-label fs-12 text-secondary"
            >
              Este rol atiende citas médicas
            </label>
          </div>

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
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Crear / Editar usuario (idéntico a GestionUsuarios.tsx) ────────────
function ModalUsuario({
  usuario,
  rolesActivos,
  onGuardar,
  onCerrar,
}: ModalUsuarioProps) {
  const esNuevo = !usuario?.id;

  const [form, setForm] = useState<FormUsuario>({
    nombre: usuario?.nombre ?? "",
    apellido1: usuario?.apellido1 ?? "",
    apellido2: usuario?.apellido2 ?? "",
    telefono: usuario?.telefono ?? "",
    correo: usuario?.correo ?? "",
    rol: usuario?.rol ?? "",
    estado: usuario?.estado ?? "Activo",
    ingreso: usuario?.ingreso ?? new Date().toLocaleDateString("es-CR"),
    iniciales: usuario?.iniciales ?? "",
    nombreUsuario: usuario?.nombreUsuario ?? "",
    ident: usuario?.ident ?? "",
    ...(usuario?.id ? { id: usuario.id } : {}),
  });
  const [contrasena, setContrasena] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleChange = <K extends keyof FormUsuario>(
    campo: K,
    valor: FormUsuario[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "nombre" || campo === "apellido1") {
        const nombre = campo === "nombre" ? (valor as string) : prev.nombre;
        const apellido1 =
          campo === "apellido1" ? (valor as string) : prev.apellido1;
        next.iniciales =
          `${nombre[0] ?? ""}${apellido1[0] ?? ""}`.toUpperCase();
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
      setError(
        "El primer apellido debe tener solo letras, entre 2 y 50 caracteres.",
      );
      return;
    }
    if (!validarNombre(form.apellido2 ?? "")) {
      setError(
        "El segundo apellido debe tener solo letras, entre 2 y 50 caracteres.",
      );
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
      setError(
        "El usuario de acceso debe tener entre 3 y 30 caracteres (letras, números, puntos o guiones).",
      );
      return;
    }
    if (!validarCedula(form.ident)) {
      setError("La cédula/identificación debe tener el formato 1-2345-6789.");
      return;
    }
    if (esNuevo && !validarContrasena(contrasena)) {
      setError("La contraseña debe tener al menos 3 caracteres.");
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
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al guardar el usuario. Intenta de nuevo.",
      );
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
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Crear nuevo usuario" : "Editar usuario"}
          </h3>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0"
          >
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
              <div className="col-6">
                <Field label="Teléfono">
                  <input
                    value={form.telefono ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "telefono",
                        formatearTelefono(e.target.value),
                      )
                    }
                    placeholder="8888-0000"
                    inputMode="numeric"
                    maxLength={9}
                    className="form-control form-control-sm"
                  />
                </Field>
              </div>
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
            <div className="col-5">
              <Field label="Usuario de acceso">
                <input
                  value={form.nombreUsuario}
                  onChange={(e) =>
                    handleChange("nombreUsuario", e.target.value)
                  }
                  placeholder="jvenegas"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-7">
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
                <option key={r.IdRol} value={r.NombreRol}>
                  {r.NombreRol}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select
              value={form.estado}
              onChange={(e) =>
                handleChange("estado", e.target.value as EstadoUsuario)
              }
              className="form-select form-select-sm"
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </Field>

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2 flex-shrink-0">
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
              : esNuevo
                ? "Crear usuario"
                : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionRoles() {
  const { usuarios, especialidades, roles, cargando } = useClinicaStore();

  const [rolActual, setRolActual] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");
  const [modalUsuario, setModalUsuario] = useState<UsuarioClinica | undefined>(
    undefined,
  );
  const [modalEditarRol, setModalEditarRol] = useState<RolBD | null>(null);
  const [confirmEstadoUsuario, setConfirmEstadoUsuario] =
    useState<UsuarioClinica | null>(null);
  const [confirmEstadoRol, setConfirmEstadoRol] = useState<RolBD | null>(null);

  const rolesActivos = useMemo(
    () => roles.filter((r) => r.Estado !== "I"),
    [roles],
  );

  const catalogoRoles: RolCatalogo[] = useMemo(
    () =>
      roles.map((r) => {
        const info = ROLES_INFO[r.NombreRol];
        return {
          id: r.IdRol,
          nombre: r.NombreRol,
          cita: r.cita,
          estado: r.Estado ?? "A",
          icono: info?.icono ?? ICONO_ROL_PERSONALIZADO,
          descripcion: info?.descripcion ?? DESCRIPCION_GENERICA,
          esSistema: !!info,
        };
      }),
    [roles],
  );

  // Rol "efectivo": el elegido por el usuario, o si aún no hay ninguno
  // (primera carga), el primero del catálogo. Se calcula en cada render,
  // sin necesidad de un efecto que llame a setState (evita el warning
  // "Avoid calling setState() directly within an effect").
  const rolActualEfectivo = rolActual || catalogoRoles[0]?.nombre || "";

  const conteoPorRol = useMemo(() => {
    const conteo: Record<string, number> = {};
    catalogoRoles.forEach((r) => {
      conteo[r.nombre] = usuarios.filter((u) => u.rol === r.nombre).length;
    });
    return conteo;
  }, [usuarios, catalogoRoles]);

  const rolActualInfo =
    catalogoRoles.find((r) => r.nombre === rolActualEfectivo) ??
    catalogoRoles[0];

  const usuariosDelRol = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter(
      (u) =>
        u.rol === rolActualEfectivo &&
        (nombreCompletoDe(u).toLowerCase().includes(termino) ||
          u.correo.toLowerCase().includes(termino)),
    );
  }, [usuarios, rolActualEfectivo, busqueda]);

  const guardarUsuario = async (
    form: FormUsuario & { contrasena?: string },
  ) => {
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

  const solicitarCambioEstadoUsuario = (usuario: UsuarioClinica) => {
    setConfirmEstadoUsuario(usuario);
  };

  const confirmarCambioEstadoUsuario = async () => {
    if (confirmEstadoUsuario) {
      await clinicaStore.toggleEstadoUsuario(confirmEstadoUsuario.id);
    }
    setConfirmEstadoUsuario(null);
  };

  const guardarEdicionRol = async (
    nombre: string,
    cita: boolean,
    estado: "A" | "I",
  ) => {
    if (!modalEditarRol) return;
    const nombreAnterior = modalEditarRol.NombreRol;
    await clinicaStore.actualizarRol(modalEditarRol, {
      nombreRol: nombre,
      cita,
      estado,
    });
    if (rolActualEfectivo === nombreAnterior) {
      setRolActual(nombre);
    }
    setModalEditarRol(null);
  };

  const solicitarCambioEstadoRol = (rol: RolBD) => {
    setConfirmEstadoRol(rol);
  };

  const confirmarCambioEstadoRol = async () => {
    if (confirmEstadoRol) {
      await clinicaStore.toggleEstadoRol(confirmEstadoRol.IdRol);
    }
    setConfirmEstadoRol(null);
  };

  return (
    <>
      {modalEditarRol && (
        <ModalEditarRol
          rol={modalEditarRol}
          onGuardar={guardarEdicionRol}
          onCerrar={() => setModalEditarRol(null)}
        />
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

      {confirmEstadoRol && (
        <ModalConfirmarEstadoRol
          rol={confirmEstadoRol}
          onConfirmar={confirmarCambioEstadoRol}
          onCerrar={() => setConfirmEstadoRol(null)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark mb-0">Gestión de roles</h2>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">
              Cargando roles…
            </p>
          ) : catalogoRoles.length === 0 ? (
            <div className="bg-soft border rounded p-4 text-center">
              <p className="fs-6 text-secondary mb-0">
                Aún no hay roles registrados.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {/* Lista de roles */}
              <div className="col-12 col-lg-3" style={{ maxWidth: 300 }}>
                <p
                  className="fs-11 text-uppercase text-secondary fw-medium mb-2"
                  style={{ letterSpacing: ".03em" }}
                >
                  Roles del sistema
                </p>
                <div className="d-flex flex-column gap-2">
                  {catalogoRoles.map((r) => (
                    <div
                      key={r.id}
                      className={`position-relative px-3 py-3 rounded border bg-white ${
                        r.nombre === rolActualEfectivo
                          ? "border-primary-subtle bg-primary bg-opacity-10"
                          : ""
                      } ${r.estado === "I" ? "opacity-60" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRolActual(r.nombre);
                          setBusqueda("");
                        }}
                        className="btn text-start p-0 border-0 bg-transparent w-100"
                        style={{ paddingRight: 70 }}
                      >
                        <p
                          className={`fs-6 fw-medium d-flex align-items-center gap-2 mb-0 ${r.nombre === rolActualEfectivo ? "text-primary" : "text-dark"}`}
                        >
                          <i
                            className={`bi bi-${r.icono}`}
                            aria-hidden="true"
                          />{" "}
                          {r.nombre}
                        </p>
                        <p className="fs-11 text-secondary mt-1 mb-0">
                          {r.descripcion}
                        </p>
                        <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                          <span className="badge-soft badge-soft-gray fw-medium">
                            {conteoPorRol[r.nombre] ?? 0} usuarios
                          </span>
                          {!r.esSistema && (
                            <span className="badge-soft badge-soft-gray fw-medium">
                              Personalizado
                            </span>
                          )}
                          {r.estado === "I" && (
                            <span className="badge-soft badge-soft-gray fw-medium">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="position-absolute top-0 end-0 mt-3 me-3 d-flex gap-1">
                        <button
                          onClick={() =>
                            setModalEditarRol({
                              IdRol: r.id,
                              NombreRol: r.nombre,
                              cita: r.cita,
                              Estado: r.estado,
                            })
                          }
                          aria-label="Editar rol"
                          title="Editar rol"
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        >
                          <i
                            className="bi bi-pencil-square"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() =>
                            solicitarCambioEstadoRol({
                              IdRol: r.id,
                              NombreRol: r.nombre,
                              cita: r.cita,
                              Estado: r.estado,
                            })
                          }
                          aria-label={
                            r.estado === "A" ? "Desactivar rol" : "Activar rol"
                          }
                          title={
                            r.estado === "A" ? "Desactivar rol" : "Activar rol"
                          }
                          className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        >
                          <i
                            className={`bi ${r.estado === "A" ? "bi-lock-fill" : "bi-unlock-fill"}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel de usuarios del rol */}
              <div className="col-12 col-lg">
                <div className="bg-soft border rounded px-3 py-3 mb-3">
                  <p className="fs-6 fw-medium text-dark mb-0">
                    {rolActualInfo?.nombre}
                  </p>
                  <p className="fs-11 text-secondary mt-1 mb-0">
                    {conteoPorRol[rolActualEfectivo] ?? 0} usuarios ·{" "}
                    {rolActualInfo?.descripcion}
                  </p>
                </div>

                {/* Buscador */}
                <div
                  className="input-group input-group-sm mb-3"
                  style={{ maxWidth: 320 }}
                >
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
                    style={{
                      letterSpacing: ".03em",
                      gridTemplateColumns: COLUMNAS_TABLA_ROLES,
                    }}
                  >
                    <span />
                    <span>Usuario</span>
                    <span>Correo</span>
                    <span>Especialidad</span>
                    <span>Estado</span>
                    <span className="text-center">Acciones</span>
                  </div>

                  {usuariosDelRol.length === 0 ? (
                    <div className="px-3 py-5 text-center text-secondary">
                      <i
                        className="bi bi-people fs-3 d-block mb-2"
                        aria-hidden="true"
                      />
                      <p className="fs-12 mb-0">
                        No hay usuarios registrados con este rol.
                      </p>
                    </div>
                  ) : (
                    usuariosDelRol.map((u, i) => {
                      const especialidadTexto = especialidadesDe(
                        u,
                        especialidades,
                      );
                      const puedeEditar = clinicaStore.puedeEditarUsuario(u);
                      return (
                        <div
                          key={u.id}
                          className={`d-grid px-3 py-3 border-bottom align-items-center fs-6 hover-row ${u.estado === "Inactivo" ? "opacity-60" : ""}`}
                          style={{ gridTemplateColumns: COLUMNAS_TABLA_ROLES }}
                        >
                          <div
                            className={`avatar-circle ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                          >
                            {u.iniciales}
                          </div>
                          <div>
                            <p className="fw-medium text-dark mb-0">
                              {nombreCompletoDe(u)}
                            </p>
                            <p className="fs-11 text-secondary mb-0">
                              Desde {u.ingreso}
                            </p>
                          </div>
                          <p className="text-secondary fs-12 text-truncate mb-0">
                            {u.correo}
                          </p>
                          <div>
                            {especialidadTexto === "—" ? (
                              <span className="text-secondary fs-12">—</span>
                            ) : (
                              <span className="badge-soft badge-soft-amber">
                                {especialidadTexto}
                              </span>
                            )}
                          </div>
                          <div>
                            <span
                              className={`badge-soft ${u.estado === "Activo" ? "badge-soft-green" : "badge-soft-gray"}`}
                            >
                              {u.estado}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {puedeEditar ? (
                              <>
                                <IconBtn
                                  label="Editar usuario"
                                  onClick={() => setModalUsuario(u)}
                                >
                                  <i
                                    className="bi bi-pencil-square"
                                    aria-hidden="true"
                                  />
                                </IconBtn>
                                <IconBtn
                                  label={
                                    u.estado === "Activo"
                                      ? "Desactivar usuario"
                                      : "Activar usuario"
                                  }
                                  onClick={() =>
                                    solicitarCambioEstadoUsuario(u)
                                  }
                                >
                                  <i
                                    className={`bi ${u.estado === "Activo" ? "bi-lock-fill" : "bi-unlock-fill"}`}
                                    aria-hidden="true"
                                  />
                                </IconBtn>
                              </>
                            ) : (
                              <span
                                className="fs-11 text-secondary"
                                title="Solo el administrador principal puede modificar a otro administrador"
                              >
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
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
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label fs-12 text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
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
