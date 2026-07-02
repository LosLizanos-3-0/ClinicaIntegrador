import React from "react";
import type { Credencial, RolUsuario } from "../../types/clinica.types";

interface ModuloInicio {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
  colorClase: string;
}

const MODULOS_POR_ROL: Record<RolUsuario, ModuloInicio[]> = {
  Administrador: [
    { id: "usuarios",       label: "Gestión de usuarios",       descripcion: "Crear, editar y asignar roles",       icono: "👤", colorClase: "badge-soft-blue" },
    { id: "reportes",       label: "Gestión de reportes",       descripcion: "Reportes de citas y financieros",     icono: "📊", colorClase: "badge-soft-emerald" },
    { id: "especialidades", label: "Gestión de especialidades", descripcion: "Especialidades médicas y médicos",    icono: "🩺", colorClase: "badge-soft-purple" },
    { id: "roles",          label: "Gestión de roles",          descripcion: "Permisos por rol del sistema",        icono: "🛡️", colorClase: "badge-soft-amber" },
  ],
  Recepcionista: [
    { id: "pacientes", label: "Gestión de pacientes", descripcion: "Registro y datos de pacientes", icono: "🧾", colorClase: "badge-soft-blue" },
    { id: "citas",     label: "Gestión de citas",     descripcion: "Agendar, reprogramar y cancelar", icono: "📅", colorClase: "badge-soft-green" },
    { id: "facturas",  label: "Generar facturas",     descripcion: "Facturación de consultas",       icono: "🧮", colorClase: "badge-soft-amber" },
  ],
  Médico: [
    { id: "citas-medico", label: "Recepción de citas", descripcion: "Consulta y expediente del paciente", icono: "🩹", colorClase: "badge-soft-emerald" },
  ],
  Enfermera: [],
  Farmacéutico: [
    { id: "recetas",    label: "Consulta de recetas",     descripcion: "Validar y entregar medicamentos", icono: "", colorClase: "" },
    { id: "inventario", label: "Gestión de inventario",   descripcion: "Añadir y modificar medicamentos", icono: "", colorClase: "" },
  ],
};

interface InicioProps {
  credencial: Credencial;
  onSeleccionarModulo: (id: string) => void;
  onCerrarSesion: () => void;
}

export default function Inicio({ credencial, onSeleccionarModulo, onCerrarSesion }: InicioProps) {
  const modulos = MODULOS_POR_ROL[credencial.rol] ?? [];

  return (
    <div className="min-vh-100 bg-light">
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
          <button onClick={onCerrarSesion} className="btn btn-outline-secondary btn-sm">
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
                <div className={`icon-box badge-soft ${m.colorClase} mb-3`} style={{ borderRadius: ".5rem", fontSize: "1.1rem" }}>
                  {m.icono}
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