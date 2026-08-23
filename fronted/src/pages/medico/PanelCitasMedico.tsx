import { useMemo, useState } from "react";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";
import type { EstadoCita, ConsultaMedica } from "../../types/clinica.types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ESTADO_BADGE: Record<EstadoCita, string> = {
  Programada: "bg-warning text-dark",
  Confirmada: "bg-info text-dark",
  Atendida: "bg-success",
  Cancelada: "bg-danger",
};

const ESTADO_BLOQUEADO: EstadoCita[] = ["Atendida", "Cancelada"];

interface MedicamentoForm {
  medicamentoId: number | "";
  cantidad: string;
  indicaciones: string;
}

const MEDICAMENTO_VACIO: MedicamentoForm = {
  medicamentoId: "",
  cantidad: "",
  indicaciones: "",
};

export default function PanelCitasMedico() {
  const snap = useClinicaStore();
  const credencial = snap.usuarioActual;

  const medico = useMemo(
    () => snap.usuarios.find((u) => u.nombreUsuario === credencial?.usuario),
    [snap.usuarios, credencial],
  );

  const citasMedico = useMemo(
    () => (medico ? snap.citas.filter((c) => c.medicoId === medico.id) : []),
    [snap.citas, medico],
  );

  const medicamentosDisponibles = useMemo(
    () =>
      snap.medicamentos.filter((m) => m.estado === "A" && m.stockActual > 0),
    [snap.medicamentos],
  );

  const medicamentosPorId = useMemo(
    () => new Map(snap.medicamentos.map((m) => [m.id, m])),
    [snap.medicamentos],
  );

  const hoy = new Date();
  const [cursorMes, setCursorMes] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fmtDate(hoy));

  const [citaActualId, setCitaActualId] = useState<number | null>(null);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [modalExpedienteAbierto, setModalExpedienteAbierto] = useState(false);
  const [historialPaciente, setHistorialPaciente] = useState<ConsultaMedica[]>(
    [],
  );
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [observaciones, setObservaciones] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [medicamentosForm, setMedicamentosForm] = useState<MedicamentoForm[]>([
    { ...MEDICAMENTO_VACIO },
  ]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const citaActual = citasMedico.find((c) => c.id === citaActualId) ?? null;

  const diasDelMes = useMemo(() => {
    const primerDia = new Date(
      cursorMes.getFullYear(),
      cursorMes.getMonth(),
      1,
    );
    const ultimoDia = new Date(
      cursorMes.getFullYear(),
      cursorMes.getMonth() + 1,
      0,
    );
    const offset = primerDia.getDay();
    const dias: (string | null)[] = Array(offset).fill(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(
        fmtDate(new Date(cursorMes.getFullYear(), cursorMes.getMonth(), dia)),
      );
    }
    return dias;
  }, [cursorMes]);

  const fechasConCitas = useMemo(
    () =>
      new Set(
        citasMedico
          .filter((c) => !ESTADO_BLOQUEADO.includes(c.estado))
          .map((c) => c.fecha),
      ),
    [citasMedico],
  );

  const citasDelDia = useMemo(
    () =>
      citasMedico
        .filter((c) => c.fecha === fechaSeleccionada)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citasMedico, fechaSeleccionada],
  );

  function abrirModalCita(id: number) {
    setCitaActualId(id);
    setObservaciones("");
    setDiagnostico("");
    setTratamiento("");
    setMedicamentosForm([{ ...MEDICAMENTO_VACIO }]);
    setError("");
    setModalCitaAbierto(true);
  }

  function cerrarModalCita() {
    setModalCitaAbierto(false);
    setCitaActualId(null);
  }

  async function handleConfirmar() {
    if (!citaActual) return;
    await clinicaStore.confirmarCita(citaActual.id);
  }
  async function handleMarcarAtendida() {
    if (!citaActual) return;
    await clinicaStore.marcarCitaAtendida(citaActual.id);
  }
  async function handleCancelar() {
    if (!citaActual) return;
    await clinicaStore.cancelarCita(citaActual.id);
  }

  async function abrirExpediente() {
    if (!citaActual) return;
    setModalExpedienteAbierto(true);
    setCargandoHistorial(true);
    try {
      const historial = await clinicaStore.obtenerHistorialPaciente(
        citaActual.pacienteId,
      );
      setHistorialPaciente(historial);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  }

  function agregarFilaMedicamento() {
    setMedicamentosForm((prev) => [...prev, { ...MEDICAMENTO_VACIO }]);
  }

  function quitarFilaMedicamento(index: number) {
    setMedicamentosForm((prev) => prev.filter((_, i) => i !== index));
  }

  function actualizarMedicamento<K extends keyof MedicamentoForm>(
    index: number,
    campo: K,
    valor: MedicamentoForm[K],
  ) {
    setMedicamentosForm((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [campo]: valor } : m)),
    );
  }

  async function registrarExpediente() {
    if (!citaActual || !medico) return;
    if (!diagnostico.trim() && !tratamiento.trim() && !observaciones.trim()) {
      setError("Ingresa al menos observaciones, diagnóstico o tratamiento.");
      return;
    }

    const items = medicamentosForm
      .filter((m) => m.medicamentoId && m.cantidad.trim())
      .map((m) => ({
        medicamentoId: Number(m.medicamentoId),
        cantidad: Number(m.cantidad),
        indicaciones: m.indicaciones.trim() || undefined,
      }));

    for (const item of items) {
      const medicamento = medicamentosPorId.get(item.medicamentoId);
      if (!medicamento || medicamento.estado !== "A") {
        setError(
          "Uno de los medicamentos seleccionados ya no está disponible.",
        );
        return;
      }
      if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
        setError("La cantidad de cada medicamento debe ser mayor a cero.");
        return;
      }
      if (item.cantidad > medicamento.stockActual) {
        setError(
          `No hay stock suficiente de ${medicamento.nombre}. Disponible: ${medicamento.stockActual}.`,
        );
        return;
      }
    }

    setGuardando(true);
    setError("");
    try {
      await clinicaStore.registrarAtencionMedica({
        pacienteId: citaActual.pacienteId,
        medicoId: medico.id,
        citaId: citaActual.id,
        observaciones: observaciones.trim() || undefined,
        diagnostico: diagnostico.trim() || undefined,
        tratamiento: tratamiento.trim() || undefined,
        medicamentos: items,
      });
      cerrarModalCita();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al registrar el expediente. Intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  }

  const bloqueado = citaActual
    ? ESTADO_BLOQUEADO.includes(citaActual.estado)
    : false;

  if (snap.cargando) {
    return (
      <div className="text-center text-secondary py-5">Cargando citas...</div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0">Panel de citas</h4>
          <p className="text-secondary mb-0 small">
            {credencial?.nombreCompleto ?? "Médico"}
            {medico?.especialidadIds && medico.especialidadIds.length > 0
              ? ` — ${medico.especialidadIds
                  .map((id) => clinicaStore.nombreEspecialidad(snap, id))
                  .join(", ")}`
              : ""}
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  setCursorMes(
                    new Date(
                      cursorMes.getFullYear(),
                      cursorMes.getMonth() - 1,
                      1,
                    ),
                  )
                }
              >
                &lt;
              </button>
              <strong>
                {MESES[cursorMes.getMonth()]} {cursorMes.getFullYear()}
              </strong>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  setCursorMes(
                    new Date(
                      cursorMes.getFullYear(),
                      cursorMes.getMonth() + 1,
                      1,
                    ),
                  )
                }
              >
                &gt;
              </button>
            </div>
            <div className="card-body">
              <div
                className="d-grid gap-1"
                style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
              >
                {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
                  <div key={d} className="text-center fw-bold small">
                    {d}
                  </div>
                ))}
              </div>
              <div
                className="d-grid gap-1 mt-1"
                style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
              >
                {diasDelMes.map((fechaStr, i) =>
                  fechaStr === null ? (
                    <div key={`vacio-${i}`} />
                  ) : (
                    <button
                      key={fechaStr}
                      onClick={() => setFechaSeleccionada(fechaStr)}
                      className={`btn btn-sm rounded text-center py-2 position-relative ${
                        fechaStr === fechaSeleccionada
                          ? "btn-primary"
                          : "btn-light"
                      }`}
                    >
                      {Number(fechaStr.slice(-2))}
                      {fechasConCitas.has(fechaStr) && (
                        <span
                          className={`position-absolute top-0 start-50 translate-middle-x mt-1 rounded-circle ${
                            fechaStr === fechaSeleccionada
                              ? "bg-white"
                              : "bg-danger"
                          }`}
                          style={{ width: 6, height: 6 }}
                        />
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <strong>Citas del día: {fechaSeleccionada}</strong>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Cédula</th>
                    <th>Especialidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasDelDia.map((c) => (
                    <tr
                      key={c.id}
                      role="button"
                      onClick={() => abrirModalCita(c.id)}
                    >
                      <td>{c.hora}</td>
                      <td>{c.paciente}</td>
                      <td>{c.cedulaPaciente}</td>
                      <td>{c.especialidad}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[c.estado]}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {citasDelDia.length === 0 && (
                <div className="text-center text-secondary p-4">
                  No hay citas registradas para esta fecha.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalCitaAbierto && citaActual && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detalle de la cita</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={cerrarModalCita}
                  />
                </div>
                <div className="modal-body">
                  {!bloqueado && citaActual.estado === "Programada" && (
                    <div className="alert alert-info py-2 mb-3">
                      Esta cita aún no ha sido <strong>confirmada</strong> por
                      recepción. Puedes confirmarla desde aquí, pero no podrás
                      marcarla como atendida ni registrar el expediente hasta
                      que esté confirmada.
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Fecha
                      </label>
                      <div className="fw-semibold">{citaActual.fecha}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Hora
                      </label>
                      <div className="fw-semibold">{citaActual.hora}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Especialidad
                      </label>
                      <div className="fw-semibold">
                        {citaActual.especialidad}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Motivo
                      </label>
                      <div className="fw-semibold">{citaActual.motivo}</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label small text-secondary mb-0">
                        Estado de la cita
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-info"
                          disabled={
                            bloqueado || citaActual.estado === "Confirmada"
                          }
                          onClick={handleConfirmar}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={
                            bloqueado || citaActual.estado !== "Confirmada"
                          }
                          onClick={handleMarcarAtendida}
                          title={
                            citaActual.estado === "Programada"
                              ? "El recepcionista debe confirmar la cita primero"
                              : undefined
                          }
                        >
                          Marcar atendida
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled={bloqueado}
                          onClick={handleCancelar}
                        >
                          Cancelar cita
                        </button>
                      </div>
                    </div>

                    <div className="col-12">
                      <hr />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Nombre paciente
                      </label>
                      <div className="fw-semibold">{citaActual.paciente}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">
                        Cédula paciente
                      </label>
                      <div className="fw-semibold">
                        {citaActual.cedulaPaciente}
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Expediente</h6>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={abrirExpediente}
                    >
                      Ver historial
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">
                      Observaciones generales
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      disabled={bloqueado}
                      placeholder="Antecedentes, alergias, etc."
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small">Diagnóstico</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                        disabled={bloqueado}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Tratamiento</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={tratamiento}
                        onChange={(e) => setTratamiento(e.target.value)}
                        disabled={bloqueado}
                      />
                    </div>
                  </div>

                  <label className="form-label small">Receta (opcional)</label>
                  {medicamentosForm.map((m, i) => (
                    <div
                      key={i}
                      className="border rounded p-2 mb-2 d-flex gap-2 align-items-center"
                    >
                      <select
                        className="form-select form-select-sm"
                        value={m.medicamentoId}
                        onChange={(e) =>
                          actualizarMedicamento(
                            i,
                            "medicamentoId",
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        disabled={bloqueado}
                      >
                        <option value="">Selecciona medicamento…</option>
                        {medicamentosDisponibles.map((med) => (
                          <option key={med.id} value={med.id}>
                            {med.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={
                          m.medicamentoId
                            ? medicamentosPorId.get(m.medicamentoId)
                                ?.stockActual
                            : undefined
                        }
                        className="form-control form-control-sm"
                        style={{ maxWidth: 90 }}
                        placeholder="Cant."
                        value={m.cantidad}
                        onChange={(e) =>
                          actualizarMedicamento(i, "cantidad", e.target.value)
                        }
                        disabled={bloqueado}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Indicaciones"
                        value={m.indicaciones}
                        onChange={(e) =>
                          actualizarMedicamento(
                            i,
                            "indicaciones",
                            e.target.value,
                          )
                        }
                        disabled={bloqueado}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => quitarFilaMedicamento(i)}
                        disabled={medicamentosForm.length === 1 || bloqueado}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-1"
                    onClick={agregarFilaMedicamento}
                    disabled={bloqueado}
                  >
                    Añadir otro medicamento
                  </button>

                  {error && (
                    <div className="alert alert-danger py-2 mt-3 mb-0 small">
                      {error}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={
                      bloqueado ||
                      guardando ||
                      citaActual.estado !== "Confirmada"
                    }
                    onClick={registrarExpediente}
                    title={
                      citaActual.estado === "Programada"
                        ? "El recepcionista debe confirmar la cita primero"
                        : undefined
                    }
                  >
                    {guardando ? "Guardando…" : "Registrar expediente"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cerrarModalCita}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {modalExpedienteAbierto && citaActual && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ zIndex: 1060 }}
          >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Historial de {citaActual.paciente}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModalExpedienteAbierto(false)}
                  />
                </div>
                <div className="modal-body">
                  {cargandoHistorial ? (
                    <p className="text-secondary text-center py-3 mb-0">
                      Cargando historial…
                    </p>
                  ) : (
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Diagnóstico</th>
                          <th>Tratamiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialPaciente.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="text-center text-secondary"
                            >
                              Sin consultas previas registradas.
                            </td>
                          </tr>
                        ) : (
                          historialPaciente
                            .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
                            .map((c) => (
                              <tr key={c.id}>
                                <td>
                                  {new Date(c.fecha).toLocaleDateString(
                                    "es-CR",
                                  )}
                                </td>
                                <td>{c.diagnostico || "—"}</td>
                                <td>{c.tratamiento || "—"}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}
    </div>
  );
}
