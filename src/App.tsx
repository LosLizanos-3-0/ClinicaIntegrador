/**
 * App.tsx
 * Integra las 4 pantallas del módulo Admin con navegación lateral.
 *
 * Requiere: React 18+ · TypeScript · Bootstrap 5.3
 * (usa clases auxiliares definidas en clinica-admin.css)
 */

import React, { useState } from "react";
import GestionUsuarios from "./pages/GestionUsuarios";
import GestionReportes from "./pages/GestionReportes";
import GestionEspecialidades from "./pages/GestionEspecialidades";
import GestionRoles from "./pages/GestionRoles";

type Seccion = "usuarios" | "reportes" | "especialidades" | "roles";

interface NavItem {
  id: Seccion;
  label: string;
  icono: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "usuarios", label: "Usuarios", icono: "👤" },
  { id: "reportes", label: "Reportes", icono: "📊" },
  { id: "especialidades", label: "Especialidades", icono: "🩺" },
  { id: "roles", label: "Roles", icono: "🛡️" },
];

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>("usuarios");

  return (
    <div className="min-vh-100 bg-light d-flex">
      {/* Sidebar */}
      <aside className="sidebar-width bg-white border-end flex-shrink-0 d-none d-md-flex flex-column">
        {/* Logo */}
        <div className="px-4 py-4 border-bottom">
          <p className="fs-5 fw-bold text-dark mb-0">🏥 ClinicSoft</p>
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
              <span className="fs-5">{item.icono}</span>

              <div>
                <p className="lh-1 mb-0">{item.label}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-top">
          <p className="fs-12 text-secondary mb-0">
            ITI-524 · Proyecto Integrador
          </p>
        </div>
      </aside>

      {/* Navegación móvil */}
      <div className="d-md-none position-fixed bottom-0 start-0 end-0 bg-white border-top d-flex z-40">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSeccion(item.id)}
            className={`flex-fill py-2 fs-12 d-flex flex-column align-items-center border-0 bg-white ${
              seccion === item.id ? "text-primary" : "text-secondary"
            }`}
          >
            <span className="fs-5">{item.icono}</span>
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
      </main>
    </div>
  );
}
