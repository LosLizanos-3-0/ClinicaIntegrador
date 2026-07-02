/**
 * GestionRoles.tsx
 * RF08 – Gestión de Roles y Permisos
 *   ✔ Crear roles
 *   ✔ Editar nombre y descripción de roles
 *   ✔ Matriz de permisos por módulo con toggles
 *   ✔ Duplicar rol existente
 *   ✔ Guardar cambios de permisos
 *
 * RNF01 – Seguridad: cada usuario tiene permisos según su rol
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3
 * (usa clases auxiliares definidas en clinica-admin.css)
 */

import React, { useState } from "react";
import type { Rol, MatrizPermisos } from "../types/clinica.types";

// ─── Datos mock ───────────────────────────────────────────────────────────────
const ROLES_MOCK: Rol[] = [
  { id: 2, nombre: "Médico",        icono: "🩺", descripcion: "Gestión de pacientes y citas",    usuarios: 18, esSistema: false },
  { id: 4, nombre: "Recepcionista", icono: "📅", descripcion: "Agenda y atención al paciente",   usuarios: 9,  esSistema: false },
  { id: 5, nombre: "Farmacéutico",  icono: "💊", descripcion: "Gestión de recetas y farmacia",   usuarios: 4,  esSistema: false },
];

// Permisos organizados por módulo del sistema (basados en los RF del entregable)
const PERMISOS_BASE: Record<string, Record<string, string>> = {
  "Pacientes (RF02)": {
    "Registrar pacientes":         "Crear nuevos expedientes de pacientes",
    "Editar información":          "Modificar datos del paciente",
    "Eliminar pacientes":          "Borrar registros de pacientes",
    "Buscar pacientes":            "Consultar la lista de pacientes",
  },
  "Citas (RF04)": {
    "Agendar citas":               "Crear nuevas citas para pacientes",
    "Cancelar citas":              "Anular citas programadas",
    "Reprogramar citas":           "Cambiar la fecha de una cita",
    "Consultar citas por fecha":   "Ver agenda por rango de fechas",
  },
  "Expedientes (RF05)": {
    "Crear expedientes":           "Iniciar historial clínico",
    "Consultar historial clínico": "Ver expedientes de pacientes",
    "Ver diagnósticos":            "Acceder a diagnósticos y tratamientos",
  },
  "Medicamentos (RF06)": {
    "Registrar medicamentos":      "Agregar al inventario",
    "Consultar inventario":        "Ver existencias actuales",
    "Ver agotados":                "Alerta de medicamentos sin stock",
  },
  "Facturación (RF07)": {
    "Generar facturas":            "Crear documentos de cobro",
    "Registrar pagos":             "Marcar facturas como pagadas",
    "Ver historial de pagos":      "Consultar transacciones pasadas",
  },
  "Usuarios (RF08)": {
    "Crear usuarios":              "Agregar nuevas cuentas al sistema",
    "Editar usuarios":             "Modificar datos de usuarios",
    "Asignar roles":               "Cambiar el rol de un usuario",
    "Desactivar usuarios":         "Bloquear acceso de una cuenta",
  },
  "Reportes (RF09)": {
    "Ver reportes de citas":       "Estadísticas de consultas",
    "Ver reportes financieros":    "Estadísticas de facturación",
    "Exportar reportes":           "Descargar reportes en PDF/Excel",
  },
};

// Permisos predeterminados por rol
const PERMISOS_INICIALES: MatrizPermisos = {
  2: { // Médico
    "Pacientes (RF02)":   { "Registrar pacientes": false, "Editar información": true,  "Eliminar pacientes": false, "Buscar pacientes": true  },
    "Citas (RF04)":       { "Agendar citas": false,       "Cancelar citas": false,      "Reprogramar citas": false, "Consultar citas por fecha": true },
    "Expedientes (RF05)": { "Crear expedientes": true,    "Consultar historial clínico": true, "Ver diagnósticos": true },
    "Medicamentos (RF06)":{ "Registrar medicamentos": false,"Consultar inventario": true,"Ver agotados": false },
    "Facturación (RF07)": { "Generar facturas": false,    "Registrar pagos": false,     "Ver historial de pagos": false },
    "Usuarios (RF08)":    { "Crear usuarios": false,      "Editar usuarios": false,     "Asignar roles": false,      "Desactivar usuarios": false },
    "Reportes (RF09)":    { "Ver reportes de citas": true,"Ver reportes financieros": false, "Exportar reportes": false },
  },
  4: { // Recepcionista
    "Pacientes (RF02)":   { "Registrar pacientes": true,  "Editar información": true,  "Eliminar pacientes": false, "Buscar pacientes": true  },
    "Citas (RF04)":       { "Agendar citas": true,        "Cancelar citas": true,       "Reprogramar citas": true,  "Consultar citas por fecha": true },
    "Expedientes (RF05)": { "Crear expedientes": false,   "Consultar historial clínico": false, "Ver diagnósticos": false },
    "Medicamentos (RF06)":{ "Registrar medicamentos": false,"Consultar inventario": false,"Ver agotados": false },
    "Facturación (RF07)": { "Generar facturas": true,     "Registrar pagos": true,      "Ver historial de pagos": true },
    "Usuarios (RF08)":    { "Crear usuarios": false,      "Editar usuarios": false,     "Asignar roles": false,      "Desactivar usuarios": false },
    "Reportes (RF09)":    { "Ver reportes de citas": false,"Ver reportes financieros": false,"Exportar reportes": false },
  },
  5: { // Farmacéutico
    "Pacientes (RF02)":   { "Registrar pacientes": false, "Editar información": false, "Eliminar pacientes": false, "Buscar pacientes": true  },
    "Citas (RF04)":       { "Agendar citas": false,       "Cancelar citas": false,     "Reprogramar citas": false,  "Consultar citas por fecha": false },
    "Expedientes (RF05)": { "Crear expedientes": false,   "Consultar historial clínico": false, "Ver diagnósticos": false },
    "Medicamentos (RF06)":{ "Registrar medicamentos": true,"Consultar inventario": true,"Ver agotados": true },
    "Facturación (RF07)": { "Generar facturas": false,    "Registrar pagos": false,     "Ver historial de pagos": false },
    "Usuarios (RF08)":    { "Crear usuarios": false,      "Editar usuarios": false,     "Asignar roles": false,      "Desactivar usuarios": false },
    "Reportes (RF09)":    { "Ver reportes de citas": false,"Ver reportes financieros": false,"Exportar reportes": false },
  },
};

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface ModalRolProps {
  rol?: Rol;
  onGuardar: (data: { nombre: string; descripcion: string; icono: string }) => void;
  onCerrar: () => void;
}

interface GestionRolesProps {
  rolesIniciales?:     Rol[];
  permisosIniciales?:  MatrizPermisos;
  onGuardarCambios?:   (rolId: number, permisos: Record<string, Record<string, boolean>>) => void;
}

// Quita el sufijo "(RFxx)" solo para mostrarlo en pantalla; las claves de PERMISOS_BASE
// y PERMISOS_INICIALES no cambian, así que la matriz de permisos por rol sigue funcionando igual.
function nombreCategoria(categoria: string): string {
  return categoria.replace(/\s*\(RF\d+\)\s*/, "");
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`toggle-switch ${checked ? "on" : "off"}`}
    >
      <span className="knob" />
    </button>
  );
}

// ─── Modal Nuevo / Editar rol ─────────────────────────────────────────────────
function ModalRol({ rol, onGuardar, onCerrar }: ModalRolProps) {
  const [nombre,      setNombre]      = useState(rol?.nombre      ?? "");
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? "");
  const [icono,       setIcono]       = useState(rol?.icono       ?? "👤");

  const handleSubmit = () => {
    if (!nombre.trim()) { alert("El nombre del rol es obligatorio."); return; }
    onGuardar({ nombre, descripcion, icono });
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 384 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">{rol ? "Editar rol" : "Nuevo rol"}</h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 text-decoration-none p-0">✕</button>
        </div>
        <div className="p-4 d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-3">
              <label className="form-label fs-12 text-secondary mb-1">Icono</label>
              <input value={icono} onChange={(e) => setIcono(e.target.value)}
                className="form-control text-center" />
            </div>
            <div className="col-9">
              <label className="form-label fs-12 text-secondary mb-1">Nombre del rol</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Coordinador médico"
                className="form-control form-control-sm" />
            </div>
          </div>
          <div>
            <label className="form-label fs-12 text-secondary mb-1">Descripción</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del rol"
              className="form-control form-control-sm" />
          </div>
        </div>
        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm">
            {rol ? "Guardar cambios" : "Crear rol"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionRoles({
  rolesIniciales    = ROLES_MOCK,
  permisosIniciales = PERMISOS_INICIALES,
  onGuardarCambios,
}: GestionRolesProps) {
  const [roles,         setRoles]         = useState<Rol[]>(rolesIniciales);
  const [permisos,      setPermisos]      = useState<MatrizPermisos>(permisosIniciales);
  const [rolActualId,   setRolActualId]   = useState<number>(roles[0].id);
  const [modalRol,      setModalRol]      = useState<Rol | null | undefined>(undefined);
  const [guardado,      setGuardado]      = useState<boolean>(false);

  const rolActual   = roles.find((r) => r.id === rolActualId)!;
  const permisosRol = permisos[rolActualId] ?? {};

  const togglePermiso = (categoria: string, permiso: string) => {
    setPermisos((prev) => ({
      ...prev,
      [rolActualId]: {
        ...prev[rolActualId],
        [categoria]: {
          ...prev[rolActualId]?.[categoria],
          [permiso]: !prev[rolActualId]?.[categoria]?.[permiso],
        },
      },
    }));
    setGuardado(false);
  };

  const guardarRol = ({ nombre, descripcion, icono }: { nombre: string; descripcion: string; icono: string }) => {
    if (modalRol?.id) {
      setRoles((prev) => prev.map((r) => r.id === modalRol.id ? { ...r, nombre, descripcion, icono } : r));
    } else {
      const nuevoId = Date.now();
      const nuevo: Rol = { id: nuevoId, nombre, descripcion, icono, usuarios: 0, esSistema: false };
      setRoles((prev) => [...prev, nuevo]);
      // Inicializar permisos en false para el nuevo rol
      const permisosVacios: Record<string, Record<string, boolean>> = {};
      Object.entries(PERMISOS_BASE).forEach(([cat, perms]) => {
        permisosVacios[cat] = Object.fromEntries(Object.keys(perms).map((p) => [p, false]));
      });
      setPermisos((prev) => ({ ...prev, [nuevoId]: permisosVacios }));
      setRolActualId(nuevoId);
    }
    setModalRol(undefined);
  };

  const handleGuardar = () => {
    onGuardarCambios?.(rolActualId, permisosRol);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <>
      {modalRol !== undefined && (
        <ModalRol
          rol={modalRol ?? undefined}
          onGuardar={guardarRol}
          onCerrar={() => setModalRol(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-medium text-dark mb-0">Gestión de roles</h2>
            <p className="fs-12 text-secondary mt-1 mb-0"></p>
          </div>
          <button onClick={() => setModalRol(null)} className="btn btn-primary btn-sm">
            + Nuevo rol
          </button>
        </div>

        <div className="p-4 row g-4">
          {/* Lista de roles */}
          <div className="col-12 col-lg-3" style={{ maxWidth: 300 }}>
            <p className="fs-11 text-uppercase text-secondary fw-medium mb-2" style={{ letterSpacing: ".03em" }}>Roles del sistema</p>
            <div className="d-flex flex-column gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRolActualId(r.id); setGuardado(false); }}
                  className={`text-start px-3 py-3 rounded border bg-white ${
                    r.id === rolActualId ? "border-primary-subtle bg-primary bg-opacity-10" : "hover-row"
                  }`}
                >
                  <p className={`fs-6 fw-medium d-flex align-items-center gap-2 mb-0 ${r.id === rolActualId ? "text-primary" : "text-dark"}`}>
                    <span>{r.icono}</span> {r.nombre}
                  </p>
                  <p className="fs-11 text-secondary mt-1 mb-0">{r.descripcion}</p>
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <span className="badge-soft badge-soft-gray fw-medium">{r.usuarios} usuarios</span>
                    {r.esSistema && (
                      <span className="badge-soft badge-soft-red fw-medium">Sistema</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel de permisos */}
          <div className="col-12 col-lg">
            {/* Header del rol seleccionado */}
            <div className="d-flex align-items-center justify-content-between bg-soft border rounded px-3 py-3 mb-3 flex-wrap gap-2">
              <div>
                <p className="fs-6 fw-medium text-dark d-flex align-items-center gap-2 mb-0">
                  <span>{rolActual.icono}</span> {rolActual.nombre}
                </p>
                <p className="fs-11 text-secondary mt-1 mb-0">{rolActual.usuarios} usuarios · {rolActual.descripcion}</p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <button onClick={() => setModalRol(rolActual)} aria-label="Editar nombre" title="Editar nombre"
                  className="btn btn-outline-secondary btn-icon-sm bg-white">✎</button>
                <button onClick={handleGuardar}
                  className={`btn btn-sm d-flex align-items-center gap-2 ${
                    guardado ? "btn-outline-success" : "btn-outline-secondary"
                  }`}
                >
                  {guardado ? "✔ Guardado" : "💾 Guardar cambios"}
                </button>
              </div>
            </div>

            {/* Matriz de permisos */}
            {Object.entries(PERMISOS_BASE).map(([categoria, perms]) => (
              <div key={categoria} className="border rounded mb-2 overflow-hidden">
                <div className="px-3 py-2 bg-soft border-bottom d-flex align-items-center justify-content-between">
                  <p className="fs-12 fw-medium text-secondary mb-0">{nombreCategoria(categoria)}</p>
                  <span className="fs-10 text-secondary">
                    {Object.values(permisosRol[categoria] ?? {}).filter(Boolean).length} / {Object.keys(perms).length} activos
                  </span>
                </div>
                {Object.entries(perms).map(([permiso, desc]) => (
                  <div key={permiso} className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                    <div className="flex-fill pe-3">
                      <p className="fs-6 text-dark mb-0">{permiso}</p>
                      <p className="fs-11 text-secondary mt-1 mb-0">{desc}</p>
                    </div>
                    <Toggle
                      checked={permisosRol[categoria]?.[permiso] ?? false}
                      onChange={() => togglePermiso(categoria, permiso)}
                      label={permiso}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
