/**
 * GestionCitas.tsx
 */

import React, { useMemo, useState } from "react";
import type { Cita, EstadoCita } from "../../types/clinica.types";
import { clinicaStore, useClinicaStore } from "../../types/clinicaStore";

const ESTADOS: EstadoCita[] = ["Programada", "Confirmada", "Atendida", "Cancelada"];

const ESTADO_COLOR: Record<EstadoCita, string> = {
  Programada: "badge-soft-blue",
  Confirmada: "badge-soft-green",
  Atendida: "badge-soft-teal",
  Cancelada: "badge-soft-gray",
};

// ─── Tipos internos ───────────────────────────────────────────────────────────
type FormCita = {
  id?: number;
  pacienteId: number | "";
  especialidadId: number | "";
  medicoId: number | "";
  fecha: string;
  hora: string;
  motivo: string;
};

const FORM_VACIO: FormCita = { pacienteId: "", especialidadId: "", medicoId: "", fecha: "", hora: "", motivo: "" };

interface ModalCitaProps {
  cita?: Cita;
  onGuardar: (form: FormCita) => Promise<string | void>;
  onCerrar: () => void;
}

// ─── Modal Agendar / Reprogramar ──────────────────────────────────────────────
function ModalCita({ cita, onGuardar, onCerrar }: ModalCitaProps) {
  const esNueva = !cita?.id;
  const { pacientes, especialidades, usuarios } = useClinicaStore();
  const medicos = clinicaStore.medicosActivos(clinicaStore.getSnapshot());

  const especialidadesActivas = useMemo(
    () => especialidades.filter((e) => e.estado === "Activa"),
    [especialidades]
  );

  // Pacientes activos, incluyendo al ya asignado si se está reprogramando
  const pacientesSeleccionables = useMemo(
    () => pacientes.filter((p) => p.estado === "Activo" || p.id === cita?.pacienteId),
    [pacientes, cita]
  );

  const especialidadInicial = (): number | "" => {
    if (!cita) return "";
    const medico = usuarios.find((m) => m.id === cita.medicoId);
    return medico?.especialidadIds?.[0] ?? "";
  };

  const [form, setForm] = useState<FormCita>(
    cita
      ? {
          id: cita.id,
          pacienteId: cita.pacienteId,
          especialidadId: especialidadInicial(),
          medicoId: cita.medicoId,
          fecha: cita.fecha,
          hora: cita.hora,
          motivo: cita.motivo,
        }
      : { ...FORM_VACIO }
  );
  const [error, setError] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  const medicosDeEspecialidad = useMemo(() => {
    if (!form.especialidadId) return [];
    return medicos.filter((m) => (m.especialidadIds ?? []).includes(form.especialidadId as number));
  }, [medicos, form.especialidadId]);

  const handleChange = <K extends keyof FormCita>(campo: K, valor: FormCita[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleEspecialidadChange = (especialidadId: number | "") => {
    setForm((prev) => ({ ...prev, especialidadId, medicoId: "" }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId) {
      setError("Selecciona un paciente.");
      return;
    }
    if (!form.especialidadId) {
      setError("Selecciona una especialidad.");
      return;
    }
    if (!form.medicoId) {
      setError("Selecciona un médico.");
      return;
    }
    if (!form.fecha || !form.hora) {
      setError("Indica la fecha y la hora de la cita.");
      return;
    }
    if (!form.motivo.trim()) {
      setError("Describe el motivo de la consulta.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const resultado = await onGuardar(form);
      if (resultado) setError(resultado);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar la cita. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 480 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNueva ? "Agendar nueva cita" : "Reprogramar cita"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <Field label="Paciente">
            <select
              value={form.pacienteId}
              onChange={(e) => handleChange("pacienteId", e.target.value ? Number(e.target.value) : "")}
              className="form-select form-select-sm"
              disabled={!esNueva}
            >
              <option value="">Selecciona un paciente…</option>
              {pacientesSeleccionables.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido1} {p.apellido2} — {p.cedula}
                </option>
              ))}
            </select>
            {pacientesSeleccionables.length === 0 && (
              <p className="fs-11 text-secondary mt-1 mb-0">
                No hay pacientes activos registrados. Regístralos primero en "Gestión de pacientes".
              </p>
            )}
          </Field>

          <Field label="Especialidad">
            <select
              value={form.especialidadId}
              onChange={(e) => handleEspecialidadChange(e.target.value ? Number(e.target.value) : "")}
              className="form-select form-select-sm"
            >
              <option value="">Selecciona una especialidad…</option>
              {especialidadesActivas.map((esp) => (
                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
              ))}
            </select>
          </Field>

          <Field label="Médico">
            <select
              value={form.medicoId}
              onChange={(e) => handleChange("medicoId", e.target.value ? Number(e.target.value) : "")}
              className="form-select form-select-sm"
              disabled={!form.especialidadId}
            >
              <option value="">
                {form.especialidadId ? "Selecciona un médico…" : "Primero selecciona una especialidad"}
              </option>
              {medicosDeEspecialidad.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} {m.apellido1}</option>
              ))}
            </select>
            {form.especialidadId !== "" && medicosDeEspecialidad.length === 0 && (
              <p className="fs-11 text-secondary mt-1 mb-0">
                No hay médicos activos asignados a esta especialidad.
              </p>
            )}
          </Field>

          <div className="row g-3">
            <div className="col-6">
              <Field label="Fecha">
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => handleChange("fecha", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
            <div className="col-6">
              <Field label="Hora">
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => handleChange("hora", e.target.value)}
                  className="form-control form-control-sm"
                />
              </Field>
            </div>
          </div>

          <Field label="Motivo de la consulta">
            <textarea
              value={form.motivo}
              onChange={(e) => handleChange("motivo", e.target.value)}
              placeholder="Ej: Control de presión arterial"
              className="form-control form-control-sm"
              rows={2}
            />
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
            {guardando ? "Guardando…" : esNueva ? "Agendar cita" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionCitas() {
  const { citas, cargando } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [modalCita, setModalCita] = useState<Cita | null | undefined>(undefined);

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return citas
      .filter((c) => filtroEstado === "Todos" || c.estado === filtroEstado)
      .filter((c) =>
        texto === "" ||
        c.paciente.toLowerCase().includes(texto) ||
        c.cedulaPaciente.includes(texto) ||
        c.medico.toLowerCase().includes(texto)
      )
      .sort((a, b) => (a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha)));
  }, [citas, busqueda, filtroEstado]);

  const stats = {
    programadas: citas.filter((c) => c.estado === "Programada").length,
    confirmadas: citas.filter((c) => c.estado === "Confirmada").length,
    atendidas: citas.filter((c) => c.estado === "Atendida").length,
    canceladas: citas.filter((c) => c.estado === "Cancelada").length,
  };

  const guardarCita = async (form: FormCita): Promise<string | void> => {
    const { pacientes } = clinicaStore.getSnapshot();
    const medicos = clinicaStore.medicosActivos(clinicaStore.getSnapshot());
    const paciente = pacientes.find((p) => p.id === form.pacienteId);
    const medico = medicos.find((m) => m.id === form.medicoId);
    if (!paciente || !medico) return "Selecciona un paciente y un médico válidos.";

    const fechaISO = form.fecha; // el backend espera YYYY-MM-DD

    if (form.id) {
      const citaExistente = citas.find((c) => c.id === form.id);
      if (!citaExistente) return "No se encontró la cita a editar.";
      await clinicaStore.actualizarCita({
        ...citaExistente,
        medicoId: medico.id,
        medico: nombreCompleto(medico),
        fecha: fechaISO,
        hora: form.hora,
        motivo: form.motivo,
      });
    } else {
      await clinicaStore.crearCita({
        pacienteId: paciente.id,
        medicoId: medico.id,
        fecha: fechaISO,
        hora: form.hora,
        motivo: form.motivo,
      });
    }
    setModalCita(undefined);
  };

  return (
    <>
      {modalCita !== undefined && (
        <ModalCita
          cita={modalCita ?? undefined}
          onGuardar={guardarCita}
          onCerrar={() => setModalCita(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div>
            <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de citas</h2>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => setModalCita(null)} className="btn btn-primary btn-sm">
              + Nueva cita
            </button>
          </div>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando citas…</p>
          ) : (
            <>
              {/* Stats */}
              <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
                <div className="col"><StatCard label="Programadas" value={stats.programadas} color="text-primary" /></div>
                <div className="col"><StatCard label="Confirmadas" value={stats.confirmadas} color="text-success" /></div>
                <div className="col"><StatCard label="Atendidas" value={stats.atendidas} color="text-info" /></div>
                <div className="col"><StatCard label="Canceladas" value={stats.canceladas} color="text-secondary" /></div>
              </div>

              {/* Filtros */}
              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <span className="text-secondary fs-6">🔍</span>
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por paciente, cédula o médico…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="form-select form-select-sm bg-soft"
                  style={{ maxWidth: 200 }}
                >
                  <option value="Todos">Todos los estados</option>
                  {ESTADOS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>

              {citasFiltradas.length === 0 && (
                <p className="fs-6 text-secondary text-center py-4 mb-0">No hay citas para este filtro.</p>
              )}

              <div className="d-flex flex-column gap-2">
                {citasFiltradas.map((c) => (
                  <div key={c.id} className="border rounded p-3 d-flex flex-wrap align-items-center justify-content-between gap-2 hover-row">
                    <div>
                      <p className="fs-12 text-secondary mb-0">Cita #{c.id} · {c.fecha} · {c.hora}</p>
                      <p className="fw-medium text-dark mb-0">{c.paciente}</p>
                      <p className="fs-11 text-secondary mb-0">{c.medico} · {c.especialidad}</p>
                      <p className="fs-11 text-secondary mb-0">Motivo: {c.motivo}</p>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <span className={`badge-soft ${ESTADO_COLOR[c.estado]}`}>{c.estado}</span>

                      {(c.estado === "Programada" || c.estado === "Confirmada") && (
                        <>
                          <button onClick={() => setModalCita(c)} className="btn btn-outline-secondary btn-sm">
                            Reprogramar
                          </button>
                          {c.estado === "Programada" && (
                            <button onClick={() => clinicaStore.confirmarCita(c.id)} className="btn btn-outline-success btn-sm">
                              Confirmar
                            </button>
                          )}
                          {c.estado === "Confirmada" && (
                            <button onClick={() => clinicaStore.marcarCitaAtendida(c.id)} className="btn btn-success btn-sm">
                              Marcar atendida
                            </button>
                          )}
                          <button onClick={() => clinicaStore.cancelarCita(c.id)} className="btn btn-outline-danger btn-sm">
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function nombreCompleto(u: { nombre: string; apellido1: string; apellido2?: string }): string {
  return `${u.nombre} ${u.apellido1} ${u.apellido2 ?? ""}`.trim();
}

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