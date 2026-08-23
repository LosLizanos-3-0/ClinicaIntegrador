import React, { useState } from "react";
import type { Credencial } from "../../types/clinica.types";
import { clinicaStore } from "../../types/clinicaStore";
import "../../login.css";

interface LoginProps {
  onIngresar: (credencial: Credencial) => void;
  onIrARegistro: () => void;
}

const CARACTERISTICAS = [
  { icono: "calendar2-check", texto: "Gestión de citas y agenda médica" },
  { icono: "file-earmark-medical", texto: "Expedientes e historial clínico" },
  { icono: "capsule", texto: "Recetas e inventario de farmacia" },
  { icono: "bar-chart-line", texto: "Reportes y control administrativo" },
];

export default function Login({ onIngresar }: LoginProps) {
  const [usuario, setUsuario] = useState<string>("");
  const [contrasena, setContrasena] = useState<string>("");
  const [verContrasena, setVerContrasena] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !contrasena.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const credencial = await clinicaStore.iniciarSesion(usuario, contrasena);
      if (!credencial) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      onIngresar(credencial);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-stretch">
      <div className="container-fluid">
        <div className="row min-vh-100">
          {/* Panel de marca (oculto en pantallas pequeñas) */}
          <div className="col-lg-6 d-none d-lg-flex login-hero flex-column justify-content-between p-5">
            <div className="d-flex align-items-center gap-3">
              <div className="login-hero-badge">
                <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
              </div>
              <div>
                <p className="fs-4 fw-bold mb-0">ClinicSoft</p>
                <p className="fs-12 mb-0 opacity-75">
                  Sistema de gestión clínica
                </p>
              </div>
            </div>

            <div>
              <h2 className="fw-bold mb-3" style={{ maxWidth: 420 }}>
                Todo tu centro médico, organizado en un solo lugar.
              </h2>
              <p className="opacity-75 mb-4" style={{ maxWidth: 440 }}>
                Plataforma interna para el personal de la clínica: recepción,
                farmacia, consulta médica y administración.
              </p>

              <div className="d-flex flex-column gap-3">
                {CARACTERISTICAS.map((c) => (
                  <div className="login-feature" key={c.icono}>
                    <div className="icon-wrap">
                      <i className={`bi bi-${c.icono}`} aria-hidden="true" />
                    </div>
                    <p className="mb-0 pt-1 fs-6 opacity-90">{c.texto}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="fs-12 opacity-50 mb-0">
              © {new Date().getFullYear()} ClinicSoft · Acceso exclusivo para
              personal autorizado
            </p>
          </div>

          {/* Panel de formulario */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5">
            <div className="login-card">
              {/* Logo visible solo en móvil */}
              <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
                <div
                  className="icon-box"
                  style={{ backgroundColor: "#DCEEF3", color: "#0B6E8C" }}
                >
                  <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
                </div>
                <p className="fs-5 fw-bold text-dark mb-0">ClinicSoft</p>
              </div>

              <h1 className="fs-3 fw-bold text-dark mb-1">
                Bienvenido de nuevo
              </h1>
              <p className="text-secondary mb-4">
                Ingresa tus credenciales para acceder al sistema.
              </p>

              <form
                onSubmit={handleSubmit}
                className="d-flex flex-column gap-3"
              >
                {error && (
                  <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12 d-flex align-items-center gap-2">
                    <i
                      className="bi bi-exclamation-circle-fill"
                      aria-hidden="true"
                    />
                    {error}
                  </div>
                )}

                <div>
                  <label className="form-label fs-12 text-secondary mb-1">
                    Correo o usuario
                  </label>
                  <div className="input-group login-input-group border">
                    <span className="input-group-text">
                      <i className="bi bi-person-fill" aria-hidden="true" />
                    </span>
                    <input
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="trabajador@clinica.com"
                      className="form-control"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fs-12 text-secondary mb-0">
                      Contraseña
                    </label>
                  </div>
                  <div className="input-group login-input-group border">
                    <span className="input-group-text">
                      <i className="bi bi-lock-fill" aria-hidden="true" />
                    </span>
                    <input
                      type={verContrasena ? "text" : "password"}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="Contraseña"
                      className="form-control"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      className="btn d-flex align-items-center border-0 bg-transparent shadow-none text-secondary px-3"
                      tabIndex={-1}
                    >
                      <i
                        className={`bi ${verContrasena ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-login text-white py-2 mt-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      Ingresando…
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <i className="bi bi-arrow-right" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <p className="fs-12 text-secondary text-center mt-4 mb-0">
                <i className="bi bi-shield-lock me-1" aria-hidden="true" />
                Acceso restringido al personal autorizado de la clínica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
