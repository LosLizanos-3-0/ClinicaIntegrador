/**
 * App.tsx
 * Integra las pantallas generales (login, registro, inicio) y los módulos
 * de Admin y Farmacéutico con navegación lateral.
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3 · Bootstrap Icons 1.11+
 * Agregar en el <head> del proyecto (si no está ya):
 *   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
 * (usa clases auxiliares definidas en clinica-admin.css)
 *
 * Los íconos del menú lateral usan Bootstrap Icons (mismo set que el resto
 * del sistema) en vez de emojis, para un tono más formal/profesional.
 */

import React, { useEffect, useState } from "react";
import Login from "./pages/farmaceutico/Login";
import Inicio from "./pages/farmaceutico/Inicio";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import GestionReportes from "./pages/admin/GestionReportes";
import GestionEspecialidades from "./pages/admin/GestionEspecialidades";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionBitacora from "./pages/admin/GestionBitacora";
import GestionInventarioAdmin from "./pages/admin/GestionInventario";
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
    { id: "pacientes", label: "Pacientes", icono: "🧾" },
    { id: "citas", label: "Citas", icono: "📅" },
    { id: "facturas", label: "Facturas", icono: "🧮" },
  ],
  Médico: [
    { id: "citasMedico", label: "Citas", icono: "calendar-check-fill" },
  ],
};

export default function App() {
  const [vista, setVista] = useState<Vista>("login");
  const [credencial, setCredencial] = useState<Credencial | null>(null);
  const [seccion, setSeccion] = useState<Seccion | null>(null);

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
      {/* Sidebar */}
      <aside className="sidebar-width bg-white border-end flex-shrink-0 d-none d-md-flex flex-column">
        {/* Logo */}
        <div className="px-4 py-4 border-bottom d-flex align-items-center justify-content-between">
          <p className="fs-5 fw-bold text-dark mb-0">ClinicSoft</p>
          <button onClick={() => setSeccion(null)} className="btn btn-link text-secondary p-0 d-flex align-items-center gap-1" title="Inicio">
            <i className="bi bi-house-door-fill" aria-hidden="true" />
            <span className="fs-12">Inicio</span>
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-grow-1 py-2">
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

        {/* Footer */}
        <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle avatar-blue">{credencial.iniciales}</div>
            <p className="fs-11 text-secondary mb-0">{credencial.nombreCompleto}</p>
          </div>
          <button onClick={handleCerrarSesion} className="btn btn-link text-secondary p-0" title="Cerrar sesión">
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

        {seccion === "reportes" && (
          <GestionReportes
            onNuevoReporte={() => console.log("Nuevo reporte")}
            onVerReporte={(r) =>
              console.log("Ver reporte:", r.nombre)
            }
            onDescargar={(r) =>
              console.log("Descargar:", r.nombre)
            }
          />
        )}

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