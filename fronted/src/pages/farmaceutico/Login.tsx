import React, { useState } from "react";
import type { Credencial } from "../../types/clinica.types";
import { clinicaStore } from "../../types/clinicaStore";

interface LoginProps {
  onIngresar: (credencial: Credencial) => void;
  onIrARegistro: () => void;
}

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
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow-sm border"
        style={{
          width: "30vw",
          height: "50vh",
        }}
      >
        <div className="px-4 pt-4 pb-3 text-center border-bottom">
          <h1 className="fs-5 fw-bold text-dark mb-1">ClinicSoft</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 d-flex flex-column gap-3">
          {error && (
            <div className="badge-soft badge-soft-red w-100 text-start py-2 px-3 fs-12">{error}</div>
          )}

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Correo o usuario</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="trabajador@clinica.com"
              className="form-control form-control-sm"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="form-label fs-12 text-secondary mb-1">Contraseña</label>
            <div className="input-group input-group-sm">
              <input
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="contraseña"
                className="form-control"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setVerContrasena((v) => !v)}
                className="btn btn-outline-secondary"
              >
                {verContrasena ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm w-100 mt-1" disabled={cargando}>
            {cargando ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}