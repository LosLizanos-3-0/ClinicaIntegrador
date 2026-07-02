/**
 * GestionUsuarios.tsx
 * RF08 – Gestión de Usuarios
 *   ✔ Crear usuarios
 *   ✔ Editar usuarios
 *   ✔ Asignar roles
 *   ✔ Asignar especialidad (solo rol "Médico")
 *   ✔ Desactivar / Activar usuarios
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3
 * (usa clases auxiliares definidas en clinica-admin.css)
 *
 * Los datos de usuarios y especialidades viven en `clinicaStore.ts`, un store
 * compartido con GestionEspecialidades.tsx. Así, crear/editar un usuario con
 * rol "Médico" aquí se refleja automáticamente en la pantalla de
 * especialidades, y viceversa.
 */

import React, { useState, useMemo } from "react";
import type { RolUsuario, EstadoUsuario } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore, type UsuarioClinica } from "../../types/clinicaStore";

// "Enfermera" no existe en nuestro sistema, así que se excluye del selector
// de roles y de los colores de badge. (El tipo `RolUsuario` de
// clinica.types.ts puede seguir incluyéndolo; si quieres quitarlo del todo,
// bórralo también de esa unión de tipos.)
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

// La clase .grid-usuarios de clinica-admin.css fue pensada para 6 columnas
// (avatar, Usuario, Correo, Rol, Estado, Acciones). Al agregar "Especialidad"
// pasamos a 7, así que definimos aquí el layout con grid-template-columns
// explícito: así no depende de editar el CSS externo y "Acciones" ya no se
// rompe a otra línea.
const COLUMNAS_TABLA_USUARIOS = "44px 1.7fr 1.8fr 0.9fr 1.1fr 0.8fr 0.9fr";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormUsuario = Omit<UsuarioClinica, "id"> & { id?: number };

interface ModalUsuarioProps {
  usuario?: UsuarioClinica;
  onGuardar: (form: FormUsuario) => void;
  onCerrar: () => void;
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
function ModalUsuario({ usuario, onGuardar, onCerrar }: ModalUsuarioProps) {
  const esNuevo = !usuario?.id;
  const { especialidades } = useClinicaStore();
  const especialidadesActivas = especialidades.filter((e) => e.estado === "Activa");

  const [form, setForm] = useState<FormUsuario>({
    nombre:        usuario?.nombre        ?? "",
    correo:        usuario?.correo        ?? "",
    rol:           usuario?.rol           ?? "Médico",
    estado:        usuario?.estado        ?? "Activo",
    ingreso:       usuario?.ingreso       ?? new Date().toLocaleDateString("es-CR"),
    iniciales:     usuario?.iniciales     ?? "",
    especialidadId:usuario?.especialidadId,
    ...(usuario?.id ? { id: usuario.id } : {}),
  });

  const handleChange = <K extends keyof FormUsuario>(campo: K, valor: FormUsuario[K]) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "nombre") {
        const partes = (valor as string).trim().split(" ").filter(Boolean);
        next.iniciales = partes.map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
      }
      // Si el rol deja de ser "Médico", se limpia la especialidad asignada.
      if (campo === "rol" && valor !== "Médico") {
        next.especialidadId = undefined;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.correo.trim()) {
      alert("Nombre y correo son obligatorios.");
      return;
    }
    if (form.rol === "Médico" && !form.especialidadId) {
      alert("Selecciona una especialidad para el médico.");
      return;
    }
    onGuardar(form);
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 448 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Crear nuevo usuario" : "Editar usuario"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
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

          {/* RF08 – Asignar rol */}
          <Field label="Rol">
            <select
              value={form.rol}
              onChange={(e) => handleChange("rol", e.target.value as RolUsuario)}
              className="form-select form-select-sm"
            >
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>

          {/* Campo único para médicos: especialidad registrada en el sistema */}
          {form.rol === "Médico" && (
            <Field label="Especialidad">
              <select
                value={form.especialidadId ?? ""}
                onChange={(e) => handleChange("especialidadId", e.target.value ? Number(e.target.value) : undefined)}
                className="form-select form-select-sm"
              >
                <option value="">Selecciona una especialidad…</option>
                {especialidadesActivas.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.icono} {esp.nombre}</option>
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
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm">
            {esNuevo ? "Crear usuario" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionUsuarios() {
  const { usuarios, especialidades } = useClinicaStore();

  const [busqueda, setBusqueda]         = useState<string>("");
  const [filtroRol, setFiltroRol]       = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [pagina, setPagina]             = useState<number>(1);
  const [modalUsuario, setModalUsuario] = useState<UsuarioClinica | null | undefined>(undefined);
  // undefined = cerrado, null = nuevo, UsuarioClinica = editar
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

  // ── Acciones (delegan en el store compartido) ──────────────────────────────
  const guardarUsuario = (form: FormUsuario) => {
    if (form.id) {
      clinicaStore.actualizarUsuario(form as UsuarioClinica);
    } else {
      clinicaStore.crearUsuario(form);
    }
    setModalUsuario(undefined);
  };

  const toggleEstado = (usuario: UsuarioClinica) => {
    clinicaStore.toggleEstadoUsuario(usuario.id);
  };

  const especialidadDe = (u: UsuarioClinica): string => {
    if (u.rol !== "Médico") return "—";
    const esp = especialidades.find((e) => e.id === u.especialidadId);
    return esp ? `${esp.icono} ${esp.nombre}` : "—";
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
              <span className="text-secondary fs-6">🔍</span>
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
                  <IconBtn label="Editar"    onClick={() => setModalUsuario(u)}>✎</IconBtn>
                  <IconBtn label={u.estado === "Activo" ? "Desactivar" : "Activar"} onClick={() => toggleEstado(u)} warn>
                    {u.estado === "Activo" ? "🔒" : "🔓"}
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
  children, label, onClick, warn = false, danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  warn?: boolean;
  danger?: boolean;
}) {
  const cls = danger
    ? "btn-icon-danger"
    : warn
    ? "btn-icon-warn"
    : "";
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`btn btn-outline-secondary btn-icon-sm bg-white text-secondary ${cls}`}
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
