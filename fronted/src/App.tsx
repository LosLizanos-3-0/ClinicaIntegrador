import React, { useEffect, useState } from "react";
import Login from "./pages/farmaceutico/Login";
import Inicio from "./pages/farmaceutico/Inicio";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import GestionReportes from "./pages/admin/GestionReportes";
import GestionEspecialidades from "./pages/admin/GestionEspecialidades";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionBitacora from "./pages/admin/GestionBitacora";
import GestionInventarioAdmin from "./pages/admin/GestionInventarioAdmin";
import ConsultaRecetas from "./pages/farmaceutico/ConsultaRecetas";
import GestionInventario from "./pages/farmaceutico/GestionInventario";
import GestionCategoriaMedicamento from "./pages/farmaceutico/GestionCategoriaMedicamento";
import GestionPacientes from "./pages/recepcionista/GestionPacientes";
import GestionCitas from "./pages/recepcionista/GestionCitas";
import GestionFacturas from "./pages/recepcionista/GestionFacturas";
import PanelCitasMedico from "./pages/medico/PanelCitasMedico";
import type { Credencial } from "./types/clinica.types";
import { clinicaStore } from "./types/clinicaStore";

type Vista = "login" | "registro" | "inicio";

type Seccion =
  | "usuarios"
  | "reportes"
  | "especialidades"
  | "roles"
  | "bitacora"
  | "recetas"
  | "inventario"
  | "categoriaMedicamento"
  | "pacientes"
  | "citas"
  | "facturas"
  | "citasMedico";

interface NavItem {
  id: Seccion;
  label: string;
  icono: string; // nombre de ícono de Bootstrap Icons, sin el prefijo "bi-"
}

const NAV_ITEMS_POR_ROL: Record<string, NavItem[]> = {
  Administrador: [
    { id: "usuarios",        label: "Usuarios",        icono: "people-fill" },
    { id: "inventario",      label: "Inventario",      icono: "box-seam-fill" },
    { id: "reportes",        label: "Reportes",        icono: "bar-chart-fill" },
    { id: "especialidades",  label: "Especialidades",  icono: "heart-pulse-fill" },
    { id: "roles",           label: "Roles",            icono: "shield-lock-fill" },
    { id: "bitacora",        label: "Bitácora",         icono: "clock-history" },
  ],
  Farmacéutico: [
    { id: "recetas",     label: "Recetas",     icono: "file-earmark-medical-fill" },
    { id: "inventario",  label: "Inventario",  icono: "box-seam-fill" },
    { id: "categoriaMedicamento", label: "Categoría", icono: "tags-fill" },
  ],
  Recepcionista: [
    { id: "pacientes", label: "Pacientes", icono: "person-vcard-fill" },
    { id: "citas", label: "Citas", icono: "calendar-check-fill" },
    { id: "facturas", label: "Facturas", icono: "receipt-cutoff" },
  ],
  Médico: [
    { id: "citasMedico", label: "Citas", icono: "calendar-check-fill" },
  ],
};

export default function App() {
  const [vista, setVista] = useState<Vista>("login");
  const [credencial, setCredencial] = useState<Credencial | null>(null);
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [confirmCerrarSesion, setConfirmCerrarSesion] = useState(false);

  // Carga inicial de datos reales desde el backend (pacientes, citas,
  // facturas, usuarios, especialidades). Se ejecuta una sola vez al montar
  // la aplicación, sin importar en qué vista esté el usuario.
  useEffect(() => {
    clinicaStore.cargarTodo();
  }, []);

  const handleIngresar = (c: Credencial) => {
    setCredencial(c);
    setSeccion(null);
    setVista("inicio");
  };

  const handleCerrarSesion = () => {
    clinicaStore.cerrarSesion();
    setCredencial(null);
    setSeccion(null);
    setVista("login");
  };

  if (vista === "login") {
    return <Login onIngresar={handleIngresar} onIrARegistro={() => setVista("registro")} />;
  }



  if (!credencial) {
    return <Login onIngresar={handleIngresar} onIrARegistro={() => setVista("registro")} />;
  }

  if (!seccion) {
    return (
      <Inicio
        credencial={credencial}
        onSeleccionarModulo={(id) => setSeccion(id as Seccion)}
        onCerrarSesion={handleCerrarSesion}
      />
    );
  }

  const NAV_ITEMS = NAV_ITEMS_POR_ROL[credencial.rol] ?? [];

  return (
    <div className="min-vh-100 bg-light d-flex">
      {confirmCerrarSesion && (
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
              <button onClick={() => setConfirmCerrarSesion(false)} className="btn btn-outline-secondary btn-sm">
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmCerrarSesion(false); handleCerrarSesion(); }}
                className="btn btn-danger btn-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: fijo al alto de la pantalla (100vh) para que el pie con
          el nombre y el botón de cerrar sesión SIEMPRE quede visible,
          sin importar qué tan larga sea la tabla de la pantalla activa. */}
      <aside
        className="sidebar-width bg-white border-end flex-shrink-0 d-none d-md-flex flex-column"
        style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-bottom d-flex align-items-center justify-content-between flex-shrink-0">
          <p className="fs-5 fw-bold text-dark mb-0">ClinicSoft</p>
          <button onClick={() => setSeccion(null)} className="btn btn-link text-secondary p-0 d-flex align-items-center gap-1" title="Inicio">
            <i className="bi bi-house-door-fill" aria-hidden="true" />
            <span className="fs-12">Inicio</span>
          </button>
        </div>

        {/* Menú: si hay más opciones de las que caben, hace scroll interno
            en vez de empujar el pie fuera de la pantalla */}
        <nav className="flex-grow-1 py-2" style={{ overflowY: "auto", minHeight: 0 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSeccion(item.id)}
              className={`w-100 text-start d-flex align-items-center gap-3 px-4 py-3 fs-6 border-0 ${
                seccion === item.id
                  ? "bg-primary bg-opacity-10 text-primary fw-medium border-end-4 border-primary"
                  : "bg-white text-secondary hover-row"
              }`}
            >
              <i className={`bi bi-${item.icono} fs-5`} aria-hidden="true" />

              <div>
                <p className="lh-1 mb-0">{item.label}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer: ahora siempre visible, pegado al fondo del sidebar */}
        <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle avatar-blue">{credencial.iniciales}</div>
            <p className="fs-11 text-secondary mb-0">{credencial.nombreCompleto}</p>
          </div>
          <button onClick={() => setConfirmCerrarSesion(true)} className="btn btn-link text-secondary p-0" title="Cerrar sesión">
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Navegación móvil */}
      <div className="d-md-none position-fixed bottom-0 start-0 end-0 bg-white border-top d-flex z-40">
        <button
          onClick={() => setSeccion(null)}
          className="flex-fill py-2 fs-12 d-flex flex-column align-items-center border-0 bg-white text-secondary"
        >
          <i className="bi bi-house-door-fill fs-5" aria-hidden="true" />
          Inicio
        </button>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSeccion(item.id)}
            className={`flex-fill py-2 fs-12 d-flex flex-column align-items-center border-0 bg-white ${
              seccion === item.id ? "text-primary" : "text-secondary"
            }`}
          >
            <i className={`bi bi-${item.icono} fs-5`} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <main className="flex-fill p-3 p-md-4 content-main overflow-auto">
        {seccion === "usuarios" && <GestionUsuarios />}

               {seccion === "reportes" && <GestionReportes />}

        {seccion === "especialidades" && (
          <GestionEspecialidades />
        )}

        {seccion === "roles" && (
          <GestionRoles
            onGuardarCambios={(rolId, permisos) => {
              console.log(
                "Guardando permisos del rol",
                rolId,
                permisos
              );
            }}
          />
        )}

        {seccion === "bitacora" && <GestionBitacora />}

        {seccion === "recetas" && <ConsultaRecetas />}

        {seccion === "inventario" &&
          (credencial.rol === "Administrador" ? <GestionInventarioAdmin /> : <GestionInventario />)}

        {seccion === "categoriaMedicamento" && <GestionCategoriaMedicamento />}

        {seccion === "pacientes" && <GestionPacientes />}

        {seccion === "citas" && <GestionCitas />}

        {seccion === "facturas" && <GestionFacturas />}

        {seccion === "citasMedico" && <PanelCitasMedico />}
      </main>
    </div>
  );
}