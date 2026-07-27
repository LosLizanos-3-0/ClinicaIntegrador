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

  // El sproc InsertRol solo acepta Cita y NombreRol (el Estado siempre nace
  // en 'A' por el DEFAULT de la tabla). Si el usuario eligió "Inactivo" en
  // el formulario, aplicamos un segundo paso con CamEstadoRol justo después.
  async crear(nombreRol: string, cita: boolean = false, estado: "A" | "I" = "A") {
    await api.post("/roles", { cita, NombreRol: nombreRol });

    if (estado === "I") {
      const roles = await rolService.listar();
      const creado = roles
        .filter((r) => r.NombreRol === nombreRol)
        .sort((a, b) => b.IdRol - a.IdRol)[0];
      if (creado) {
        await api.patch(`/roles/${creado.IdRol}/estado`, { Estado: "I" });
      }
    }
  },

  async actualizar(id: number, nombreRol: string, cita: boolean = false) {
    await api.put(`/roles/${id}`, { cita, NombreRol: nombreRol });
  },

  async cambiarEstado(id: number, estadoActual: "A" | "I" = "A") {
    await api.patch(`/roles/${id}/estado`, { Estado: estadoActual === "A" ? "I" : "A" });
  },
};