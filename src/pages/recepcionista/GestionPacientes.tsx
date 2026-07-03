/**
 * GestionPacientes.tsx
 */

import React, { useMemo, useState } from "react";
import type { Paciente } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore } from "../../types/clinicaStore";

const POR_PAGINA = 8;

const AVATAR_COLORS: string[] = [
  "avatar-blue",
  "avatar-emerald",
  "avatar-amber",
  "avatar-pink",
  "avatar-purple",
  "avatar-teal",
];

const COLUMNAS_TABLA_PACIENTES = "44px 1.6fr 1.5fr 0.9fr 0.9fr 0.8fr 0.9fr";

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormPaciente = Omit<Paciente, "id" | "registro"> & { id?: number; registro?: string };

const FORM_VACIO: FormPaciente = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  cedula: "",
  fechaNacimiento: "",
  correo: "",
  telefono: "",
  estado: "Activo",
};

interface ModalPacienteProps {
  paciente?: Paciente;
  onGuardar: (form: FormPaciente) => string | void;
  onCerrar: () => void;
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
function ModalPaciente({ paciente, onGuardar, onCerrar }: ModalPacienteProps) {
  const esNuevo = !paciente?.id;

  const [form, setForm] = useState<FormPaciente>(
    paciente ? { ...paciente } : { ...FORM_VACIO }
  );
  const [error, setError] = useState<string>("");

  const handleChange = <K extends keyof FormPaciente>(campo: K, valor: FormPaciente[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.apellido1.trim() || !form.cedula.trim()) {
      setError("Nombre, primer apellido y cédula son obligatorios.");
      return;
    }
    if (!form.correo.trim() || !form.telefono.trim()) {
      setError("Correo y teléfono son obligatorios.");
      return;
    }
    const resultado = onGuardar(form);
    if (resultado) {
      setError(resultado);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 520 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Registrar nuevo paciente" : "Editar paciente"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <Field label="Nombre">
                <input
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-12 col-sm-4">
              <Field label="Primer apellido">
                <input
                  value={form.apellido1}
                  onChange={(e) => handleChange("apellido1", e.target.value)}
                  placeholder="Primer apellido"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-12 col-sm-4">
              <Field label="Segundo apellido">
                <input
                  value={form.apellido2}
                  onChange={(e) => handleChange("apellido2", e.target.value)}
                  placeholder="Segundo apellido"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <Field label="Cédula">
                <input
                  value={form.cedula}
                  onChange={(e) => handleChange("cedula", e.target.value)}
                  placeholder="1-1234-5678"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-12 col-sm-6">
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <Field label="Correo electrónico">
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  placeholder="paciente@correo.com"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-12 col-sm-6">
              <Field label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="8888-1234"
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm">
            {esNuevo ? "Registrar paciente" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionPacientes() {
  const { pacientes } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [pagina, setPagina] = useState<number>(1);
  const [modalPaciente, setModalPaciente] = useState<Paciente | null | undefined>(undefined);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return pacientes;
    return pacientes.filter((p) =>
      `${p.nombre} ${p.apellido1} ${p.apellido2}`.toLowerCase().includes(texto) ||
      p.cedula.toLowerCase().includes(texto) ||
      p.correo.toLowerCase().includes(texto)
    );
  }, [pacientes, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const stats = {
    total: pacientes.length,
    nuevosMes: pacientes.filter((p) => {
      const [, mes, anio] = p.registro.split("/").map(Number);
      const hoy = new Date();
      return mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();
    }).length,
  };

  const guardarPaciente = (form: FormPaciente): string | void => {
    const correoOcupado = pacientes.some(
      (p) => p.correo.toLowerCase() === form.correo.toLowerCase() && p.id !== form.id
    );
    if (correoOcupado) {
      return "Ya existe un paciente registrado con ese correo.";
    }

    if (form.id) {
      clinicaStore.actualizarPaciente({ ...(form as Paciente), id: form.id, registro: form.registro! });
    } else {
      clinicaStore.registrarPaciente({
        nombre: form.nombre,
        apellido1: form.apellido1,
        apellido2: form.apellido2,
        cedula: form.cedula,
        fechaNacimiento: form.fechaNacimiento,
        correo: form.correo,
        telefono: form.telefono,
      });
    }
    setModalPaciente(undefined);
  };

  return (
    <>
      {modalPaciente !== undefined && (
        <ModalPaciente
          paciente={modalPaciente ?? undefined}
          onGuardar={guardarPaciente}
          onCerrar={() => setModalPaciente(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        {/* Topbar */}
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de pacientes</h2>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => setModalPaciente(null)} className="btn btn-primary btn-sm">
              + Nuevo paciente
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Stats */}
          <div className="row row-cols-2 g-3 mb-4">
            <div className="col"><StatCard label="Total de pacientes" value={stats.total} /></div>
            <div className="col"><StatCard label="Registrados este mes" value={stats.nuevosMes} color="text-success" /></div>
          </div>

          {/* Búsqueda */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <span className="text-secondary fs-6">🔍</span>
              <input
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                placeholder="Buscar por nombre, cédula o correo…"
                className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="border rounded overflow-hidden">
            <div
              className="grid-usuarios d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
              style={{ letterSpacing: ".03em", gridTemplateColumns: COLUMNAS_TABLA_PACIENTES }}
            >
              <span /><span>Paciente</span><span>Correo</span><span>Teléfono</span><span>Registro</span><span>Estado</span><span className="text-center">Acciones</span>
            </div>

            {paginados.length === 0 && (
              <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron pacientes.</p>
            )}

            {paginados.map((p, i) => {
              const iniciales = `${p.nombre[0] ?? ""}${p.apellido1[0] ?? ""}`.toUpperCase();
              const activo = p.estado === "Activo";
              return (
                <div
                  key={p.id}
                  className="grid-usuarios px-3 py-3 border-bottom align-items-center fs-6 hover-row"
                  style={{ gridTemplateColumns: COLUMNAS_TABLA_PACIENTES, opacity: activo ? 1 : 0.6 }}
                >
                  <div className={`avatar-circle ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {iniciales}
                  </div>
                  <div>
                    <p className="fw-medium text-dark mb-0">{p.nombre} {p.apellido1} {p.apellido2}</p>
                    <p className="fs-11 text-secondary mb-0">Cédula {p.cedula}</p>
                  </div>
                  <p className="text-secondary fs-12 text-truncate mb-0">{p.correo}</p>
                  <p className="text-secondary fs-12 mb-0">{p.telefono}</p>
                  <p className="text-secondary fs-12 mb-0">{p.registro}</p>
                  <span className={`badge-soft ${activo ? "badge-soft-green" : "badge-soft-gray"}`}>
                    {p.estado}
                  </span>
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <IconBtn label="Editar" onClick={() => setModalPaciente(p)}>✎</IconBtn>
                    <IconBtn
                      label={activo ? "Desactivar paciente" : "Activar paciente"}
                      onClick={() => clinicaStore.toggleEstadoPaciente(p.id)}
                      warn={activo}
                    >
                      {activo ? "⏻" : "✔"}
                    </IconBtn>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          <div className="d-flex align-items-center justify-content-between mt-3 fs-12 text-secondary">
            <span>
              {filtrados.length === 0 ? "0" : `${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, filtrados.length)}`} de {filtrados.length} pacientes
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
  const cls = danger ? "btn-icon-danger" : warn ? "btn-icon-warn" : "";
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