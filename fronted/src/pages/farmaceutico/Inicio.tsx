import React, { useState } from "react";
import type { Credencial, RolUsuario } from "../../types/clinica.types";

interface ModuloInicio {
  id: string;
  label: string;
  descripcion: string;
  icono: string; // nombre de ícono de Bootstrap Icons, sin el prefijo "bi-"
  colorClase: string;
}

const MODULOS_POR_ROL: Record<RolUsuario, ModuloInicio[]> = {
  Administrador: [
    { id: "usuarios",       label: "Gestión de usuarios",       descripcion: "Crear, editar y asignar roles",       icono: "people-fill",        colorClase: "badge-soft-blue" },
    { id: "reportes",       label: "Gestión de reportes",       descripcion: "Reportes de citas y financieros",     icono: "bar-chart-fill",      colorClase: "badge-soft-emerald" },
    { id: "especialidades", label: "Gestión de especialidades", descripcion: "Especialidades médicas y médicos",    icono: "heart-pulse-fill",    colorClase: "badge-soft-purple" },
    { id: "roles",          label: "Gestión de roles",          descripcion: "Permisos por rol del sistema",        icono: "shield-lock-fill",    colorClase: "badge-soft-amber" },
  ],
  Recepcionista: [
    { id: "pacientes", label: "Gestión de pacientes", descripcion: "Registro y datos de pacientes",   icono: "person-vcard-fill",   colorClase: "badge-soft-blue" },
    { id: "citas",     label: "Gestión de citas",     descripcion: "Agendar, reprogramar y cancelar", icono: "calendar-check-fill", colorClase: "badge-soft-green" },
    { id: "facturas",  label: "Generar facturas",     descripcion: "Facturación de consultas",        icono: "receipt-cutoff",      colorClase: "badge-soft-amber" },
  ],
  Médico: [
    { id: "citas-medico", label: "Recepción de citas", descripcion: "Consulta y expediente del paciente", icono: "clipboard2-pulse-fill", colorClase: "badge-soft-emerald" },
  ],
  Enfermera: [],
  Farmacéutico: [
    { id: "recetas",             label: "Consulta de recetas",       descripcion: "Validar y entregar medicamentos",     icono: "file-earmark-medical-fill", colorClase: "badge-soft-blue" },
    { id: "inventario",          label: "Gestión de inventario",     descripcion: "Añadir y modificar medicamentos",     icono: "box-seam-fill",             colorClase: "badge-soft-teal" },
    { id: "categoriaMedicamento", label: "Categorías de medicamento", descripcion: "Organizar medicamentos por categoría", icono: "tags-fill",                colorClase: "badge-soft-purple" },
  ],
};

interface InicioProps {
  credencial: Credencial;
  onSeleccionarModulo: (id: string) => void;
  onCerrarSesion: () => void;
}

// ─── Modal: confirmar cierre de sesión ────────────────────────────────────────
function ModalConfirmarCerrarSesion({
  onConfirmar,
  onCerrar,
}: {
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1070 }}>
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 420 }}>
        <div className="p-4 d-flex flex-column align-items-center text-center">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle mb-3 bg-danger-subtle"
            style={{ width: 56, height: 56 }}
          >
            <i className="bi bi-box-arrow-right fs-3 text-danger" aria-hidden="true" />
          </div>

          <h3 className="fs-6 fw-semibold text-dark mb-2">¿Deseas cerrar sesión?</h3>

          <p className="fs-6 text-secondary mb-0">
            Tendrás que volver a ingresar tu usuario y contraseña para acceder de nuevo al sistema.
          </p>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="btn btn-danger btn-sm">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inicio({ credencial, onSeleccionarModulo, onCerrarSesion }: InicioProps) {
  const modulos = MODULOS_POR_ROL[credencial.rol] ?? [];
  const [confirmCerrarSesion, setConfirmCerrarSesion] = useState(false);

  return (
    <div className="min-vh-100 bg-light">
      {confirmCerrarSesion && (
        <ModalConfirmarCerrarSesion
          onConfirmar={() => {
            setConfirmCerrarSesion(false);
            onCerrarSesion();
          }}
          onCerrar={() => setConfirmCerrarSesion(false)}
        />
      )}

      <div className="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div>
            <p className="fs-6 fw-bold text-dark mb-0">ClinicSoft</p>
            <p className="fs-11 text-secondary mb-0">Panel de {credencial.rol.toLowerCase()}</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle avatar-blue">{credencial.iniciales}</div>
            <p className="fs-12 text-dark mb-0">{credencial.nombreCompleto}</p>
          </div>
          <button onClick={() => setConfirmCerrarSesion(true)} className="btn btn-outline-secondary btn-sm">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="p-4">
        <h2 className="fs-5 fw-bold text-dark mb-1">Hola, {credencial.nombreCompleto.split(" ")[0]}</h2>
        <p className="fs-12 text-secondary mb-4">Selecciona un módulo para continuar</p>

        {modulos.length === 0 && (
          <div className="bg-white border rounded-4 p-4 text-center">
            <p className="fs-6 text-secondary mb-0">Aún no hay módulos disponibles para este rol.</p>
          </div>
        )}

        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
          {modulos.map((m) => (
            <div key={m.id} className="col">
              <button
                onClick={() => onSeleccionarModulo(m.id)}
                className="btn text-start bg-white border rounded-4 p-4 w-100 h-100 card-hover-primary"
              >
                <div
                  className={`icon-box badge-soft ${m.colorClase} mb-3 d-inline-flex align-items-center justify-content-center`}
                  style={{ borderRadius: ".5rem", width: 40, height: 40, fontSize: "1.1rem" }}
                >
                  <i className={`bi bi-${m.icono}`} aria-hidden="true" />
                </div>
                <p className="fs-6 fw-medium text-dark mb-1">{m.label}</p>
                <p className="fs-12 text-secondary mb-0">{m.descripcion}</p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}