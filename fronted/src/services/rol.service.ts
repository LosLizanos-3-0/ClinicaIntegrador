import api from "./api";

export interface RolBD {
  IdRol: number;
  cita: boolean;
  NombreRol: string;
}

export const rolService = {
  async listar(): Promise<RolBD[]> {
    const { data } = await api.get<RolBD[]>("/roles");
    return data;
  },
};