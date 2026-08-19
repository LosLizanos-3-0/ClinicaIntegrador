import api from "./api";
import type { Credencial } from "../types/clinica.types";

interface LoginResponseBD {
  IdUsuario: number;
  Nombre: string;
  Apellido1: string;
  Apellido2: string | null;
  Correo: string;
  NombreUsuario: string;
  Rol: string;
}

export const authService = {
  async login(usuario: string, contrasena: string): Promise<Credencial> {
    const { data } = await api.post<LoginResponseBD>("/auth/login", { usuario, contrasena });
    const nombreCompleto = `${data.Nombre} ${data.Apellido1} ${data.Apellido2 ?? ""}`.trim();
    return {
      id: data.IdUsuario,
      usuario: data.NombreUsuario,
      contrasena: "",
      rol: data.Rol as Credencial["rol"],
      nombreCompleto,
      iniciales: `${data.Nombre[0] ?? ""}${data.Apellido1[0] ?? ""}`.toUpperCase(),
    };
  },
};