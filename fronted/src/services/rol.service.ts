import api from "./api";

export interface RolBD {
  IdRol: number;
  cita: boolean;
  NombreRol: string;
  Estado?: "A" | "I";
}

export const rolService = {
  async listar(): Promise<RolBD[]> {
    const { data } = await api.get<RolBD[]>("/roles");
    return data;
  },

  // "cita" y "NombreRol" coinciden exactamente con lo que lee tu modelo
  // insertRol/updateRol en el backend (data.cita, data.NombreRol).
  async crear(nombreRol: string, cita: boolean = false) {
    await api.post("/roles", { cita, NombreRol: nombreRol });
  },

  async actualizar(id: number, nombreRol: string, cita: boolean = false) {
    await api.put(`/roles/${id}`, { cita, NombreRol: nombreRol });
  },

  async cambiarEstado(id: number, estadoActual: "A" | "I" = "A") {
    await api.patch(`/roles/${id}/estado`, { Estado: estadoActual === "A" ? "I" : "A" });
  },
};