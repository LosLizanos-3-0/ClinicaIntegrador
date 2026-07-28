import { useMemo, useState } from "react";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";
import type { EstadoCita } from "../../types/clinica.types";

/* ================== HELPERS DE FECHA ================== */
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ================== ESTADOS DE CITA ================== */
const ESTADO_BADGE: Record<EstadoCita, string> = {
  Programada: "bg-warning text-dark",
  Confirmada: "bg-info text-dark",
  Atendida: "bg-success",
  Cancelada: "bg-danger",
};

const ESTADO_BLOQUEADO: EstadoCita[] = ["Atendida", "Cancelada"];

/* ================== TIPOS LOCALES (SOLO VISUAL, NO PERSISTEN AÚN) ==================
   NOTA: el backend todavía no tiene un módulo de "expediente" ni de "recetas".
   Estas estructuras son temporales, solo para mostrar el flujo visual completo.
   Cuando el backend exponga estos módulos, esto se reemplaza por llamadas reales
   a clinicaStore / servicios, igual que se hizo con citas.
*/
interface NotaLocal {
  motivo: string;
  descripcion: string;
}
interface MedicamentoLocal {
  medicamento: string;
  cantidad: string;
}

export default function PanelCitasMedico() {
  const snap = useClinicaStore();
  const credencial = snap.usuarioActual;

  // El médico logueado se identifica cruzando la credencial (usuario) con
  // el usuario real del backend (que sí tiene id numérico).
  const medico = useMemo(
    () => snap.usuarios.find((u) => u.nombreUsuario === credencial?.usuario),
    [snap.usuarios, credencial]
  );

  const citasMedico = useMemo(
    () => (medico ? snap.citas.filter((c) => c.medicoId === medico.id) : []),
    [snap.citas, medico]
  );

  const hoy = new Date();
  const [cursorMes, setCursorMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fmtDate(hoy));

  const [citaActualId, setCitaActualId] = useState<number | null>(null);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [modalExpedienteAbierto, setModalExpedienteAbierto] = useState(false);
  const [modalNotaAbierto, setModalNotaAbierto] = useState(false);
  const [modalRecetaAbierto, setModalRecetaAbierto] = useState(false);

  // Estado visual-only de notas/recetas "pendientes de guardar" por cita.
  const [notasNuevasPorCita, setNotasNuevasPorCita] = useState<Record<number, NotaLocal[]>>({});
  const [recetasNuevasPorCita, setRecetasNuevasPorCita] = useState<Record<number, MedicamentoLocal[][]>>({});

  const [notaMotivo, setNotaMotivo] = useState("");
  const [notaDescripcion, setNotaDescripcion] = useState("");
  const [medicamentosForm, setMedicamentosForm] = useState<MedicamentoLocal[]>([{ medicamento: "", cantidad: "" }]);

  const citaActual = citasMedico.find((c) => c.id === citaActualId) ?? null;
  const notasNuevas = citaActualId ? notasNuevasPorCita[citaActualId] ?? [] : [];
  const recetasNuevas = citaActualId ? recetasNuevasPorCita[citaActualId] ?? [] : [];

  /* ================== CALENDARIO ================== */
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(cursorMes.getFullYear(), cursorMes.getMonth(), 1);
    const ultimoDia = new Date(cursorMes.getFullYear(), cursorMes.getMonth() + 1, 0);
    const offset = primerDia.getDay();
    const dias: (string | null)[] = Array(offset).fill(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(fmtDate(new Date(cursorMes.getFullYear(), cursorMes.getMonth(), dia)));
    }
    return dias;
  }, [cursorMes]);

  const fechasConCitas = useMemo(() => new Set(citasMedico.map((c) => c.fecha)), [citasMedico]);

  /* ================== CITAS DEL DÍA SELECCIONADO ================== */
  const citasDelDia = useMemo(
    () =>
      citasMedico
        .filter((c) => c.fecha === fechaSeleccionada)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citasMedico, fechaSeleccionada]
  );

  /* ================== EXPEDIENTE (visual, provisional) ==================
     Mientras no exista un módulo real de expediente en el backend, mostramos
     las citas anteriores ya "Atendida" del mismo paciente como aproximación
     de su historial, usando el campo `notas` como descripción.
  */
  const expedienteVisual = useMemo(() => {
    if (!citaActual) return [];
    return citasMedico
      .filter((c) => c.pacienteId === citaActual.pacienteId && c.estado === "Atendida" && c.id !== citaActual.id)
      .sort((a, b) => (a.fecha + a.hora > b.fecha + b.hora ? -1 : 1));
  }, [citaActual, citasMedico]);

  /* ================== HANDLERS ================== */
  function abrirModalCita(id: number) {
    setCitaActualId(id);
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

  function abrirModalNota() {
    setNotaMotivo("");
    setNotaDescripcion("");
    setModalNotaAbierto(true);
  }

  function guardarNota() {
    if (!citaActualId || !notaMotivo.trim() || !notaDescripcion.trim()) return;
    setNotasNuevasPorCita((prev) => ({
      ...prev,
      [citaActualId]: [...(prev[citaActualId] ?? []), { motivo: notaMotivo.trim(), descripcion: notaDescripcion.trim() }],
    }));
    setModalNotaAbierto(false);
  }

  function abrirModalReceta() {
    setMedicamentosForm([{ medicamento: "", cantidad: "" }]);
    setModalRecetaAbierto(true);
  }

  function agregarFilaMedicamento() {
    setMedicamentosForm((prev) => [...prev, { medicamento: "", cantidad: "" }]);
  }

  function quitarFilaMedicamento(index: number) {
    setMedicamentosForm((prev) => prev.filter((_, i) => i !== index));
  }

  function actualizarMedicamento(index: number, campo: keyof MedicamentoLocal, valor: string) {
    setMedicamentosForm((prev) => prev.map((m, i) => (i === index ? { ...m, [campo]: valor } : m)));
  }

  function guardarReceta() {
    if (!citaActualId) return;
    const medicamentos = medicamentosForm.filter((m) => m.medicamento.trim() && m.cantidad.trim());
    if (medicamentos.length === 0) return;
    setRecetasNuevasPorCita((prev) => ({
      ...prev,
      [citaActualId]: [...(prev[citaActualId] ?? []), medicamentos],
    }));
    setModalRecetaAbierto(false);
  }

  function registrarExpediente() {
    // Provisional: por ahora solo limpia lo "pendiente de guardar" localmente.
    // Cuando exista el módulo real de expediente en el backend, aquí se
    // enviarán notasNuevas / recetasNuevas al servicio correspondiente.
    if (!citaActualId) return;
    setNotasNuevasPorCita((prev) => ({ ...prev, [citaActualId]: [] }));
    setRecetasNuevasPorCita((prev) => ({ ...prev, [citaActualId]: [] }));
  }

  const bloqueado = citaActual ? ESTADO_BLOQUEADO.includes(citaActual.estado) : false;

  if (snap.cargando) {
    return <div className="text-center text-secondary py-5">Cargando citas...</div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0">Panel de citas</h4>
          <p className="text-secondary mb-0 small">
            {credencial?.nombreCompleto ?? "Médico"}
            {medico?.especialidadId && medico.especialidadId.length > 0
  ? ` — ${medico.especialidadId
      .map((id) => clinicaStore.nombreEspecialidad(snap, id))
      .join(", ")}`
  : ""}
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Calendario */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setCursorMes(new Date(cursorMes.getFullYear(), cursorMes.getMonth() - 1, 1))}
              >
                &lt;
              </button>
              <strong>
                {MESES[cursorMes.getMonth()]} {cursorMes.getFullYear()}
              </strong>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setCursorMes(new Date(cursorMes.getFullYear(), cursorMes.getMonth() + 1, 1))}
              >
                &gt;
              </button>
            </div>
            <div className="card-body">
              <div className="d-grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
                  <div key={d} className="text-center fw-bold small">
                    {d}
                  </div>
                ))}
              </div>
              <div className="d-grid gap-1 mt-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {diasDelMes.map((fechaStr, i) =>
                  fechaStr === null ? (
                    <div key={`vacio-${i}`} />
                  ) : (
                    <button
                      key={fechaStr}
                      onClick={() => setFechaSeleccionada(fechaStr)}
                      className={`btn btn-sm rounded text-center py-2 position-relative ${
                        fechaStr === fechaSeleccionada ? "btn-primary" : "btn-light"
                      }`}
                    >
                      {Number(fechaStr.slice(-2))}
                      {fechasConCitas.has(fechaStr) && (
                        <span
                          className={`position-absolute top-0 start-50 translate-middle-x mt-1 rounded-circle ${
                            fechaStr === fechaSeleccionada ? "bg-white" : "bg-danger"
                          }`}
                          style={{ width: 6, height: 6 }}
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de citas */}
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
                    <tr key={c.id} role="button" onClick={() => abrirModalCita(c.id)}>
                      <td>{c.hora}</td>
                      <td>{c.paciente}</td>
                      <td>{c.cedulaPaciente}</td>
                      <td>{c.especialidad}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[c.estado]}`}>{c.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {citasDelDia.length === 0 && (
                <div className="text-center text-secondary p-4">No hay citas registradas para esta fecha.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detalle Cita */}
      {modalCitaAbierto && citaActual && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detalle de la cita</h5>
                  <button type="button" className="btn-close" onClick={cerrarModalCita} />
                </div>
                <div className="modal-body">
                  {bloqueado && (
                    <div className="alert alert-warning py-2 mb-3">
                      Esta cita está <strong>{citaActual.estado}</strong>, no se pueden agregar ni modificar datos.
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">Fecha</label>
                      <div className="fw-semibold">{citaActual.fecha}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">Hora</label>
                      <div className="fw-semibold">{citaActual.hora}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">Especialidad</label>
                      <div className="fw-semibold">{citaActual.especialidad}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">Motivo</label>
                      <div className="fw-semibold">{citaActual.motivo}</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label small text-secondary mb-0">Estado de la cita</label>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-info"
                          disabled={bloqueado || citaActual.estado === "Confirmada"}
                          onClick={handleConfirmar}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={bloqueado}
                          onClick={handleMarcarAtendida}
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
                      <label className="form-label small text-secondary mb-0">Nombre paciente</label>
                      <div className="fw-semibold">{citaActual.paciente}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-0">Cédula paciente</label>
                      <div className="fw-semibold">{citaActual.cedulaPaciente}</div>
                    </div>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Expediente</h6>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setModalExpedienteAbierto(true)}>
                      Ver expediente
                    </button>
                  </div>
                  <p className="text-secondary small">
                    Vista provisional: se muestran las citas atendidas anteriores de este paciente. El módulo de
                    expediente clínico todavía no está conectado al backend.
                  </p>

                  {notasNuevas.length > 0 && (
                    <div className="alert alert-info py-2 mb-2">
                      <strong>Notas pendientes de guardar:</strong>
                      <ul className="mb-0">
                        {notasNuevas.map((n, i) => (
                          <li key={i}>
                            <strong>{n.motivo}:</strong> {n.descripcion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recetasNuevas.length > 0 && (
                    <div className="alert alert-info py-2 mb-2">
                      <strong>Recetas pendientes de guardar:</strong>
                      {recetasNuevas.map((r, i) => (
                        <ul className="mb-0" key={i}>
                          {r.map((m, j) => (
                            <li key={j}>
                              {m.medicamento} — {m.cantidad}
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-sm btn-outline-secondary" disabled={bloqueado} onClick={abrirModalNota}>
                      Añadir notas
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" disabled={bloqueado} onClick={abrirModalReceta}>
                      Añadir receta
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-success" disabled={bloqueado} onClick={registrarExpediente}>
                    Registrar expediente
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cerrarModalCita}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Modal Expediente (provisional) */}
      {modalExpedienteAbierto && citaActual && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Expediente del paciente (provisional)</h5>
                  <button type="button" className="btn-close" onClick={() => setModalExpedienteAbierto(false)} />
                </div>
                <div className="modal-body">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expedienteVisual.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-secondary">
                            Sin citas atendidas previas registradas.
                          </td>
                        </tr>
                      ) : (
                        expedienteVisual.map((c) => (
                          <tr key={c.id}>
                            <td>{c.fecha}</td>
                            <td>{c.motivo}</td>
                            <td>
                              <span className={`badge ${ESTADO_BADGE[c.estado]}`}>{c.estado}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {/* Modal Añadir Nota */}
      {modalNotaAbierto && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Añadir nota al expediente</h5>
                  <button type="button" className="btn-close" onClick={() => setModalNotaAbierto(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Motivo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Control rutinario"
                      value={notaMotivo}
                      onChange={(e) => setNotaMotivo(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Detalle de la consulta..."
                      value={notaDescripcion}
                      onChange={(e) => setNotaDescripcion(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalNotaAbierto(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={guardarNota}>
                    Guardar nota
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {/* Modal Añadir Receta */}
      {modalRecetaAbierto && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Añadir receta</h5>
                  <button type="button" className="btn-close" onClick={() => setModalRecetaAbierto(false)} />
                </div>
                <div className="modal-body">
                  {medicamentosForm.map((m, i) => (
                    <div key={i} className="border rounded p-2 mb-2 d-flex gap-2 align-items-center">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Medicamento"
                        value={m.medicamento}
                        onChange={(e) => actualizarMedicamento(i, "medicamento", e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Cantidad / indicación"
                        value={m.cantidad}
                        onChange={(e) => actualizarMedicamento(i, "cantidad", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => quitarFilaMedicamento(i)}
                        disabled={medicamentosForm.length === 1}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={agregarFilaMedicamento}>
                    Añadir otro medicamento
                  </button>
                  <p className="text-secondary small mt-3 mb-0">
                    El catálogo de medicamentos todavía no está conectado al backend, por eso el nombre se escribe
                    libremente por ahora.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalRecetaAbierto(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={guardarReceta}>
                    Guardar receta
                  </button>
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
