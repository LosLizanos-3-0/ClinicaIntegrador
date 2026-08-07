import api from "./api";
import type { RegistroBitacora } from "../types/clinica.types";

interface BitacoraBD {
  IdBita: number;
  Tabla: string;
  Accion: string;
  Fecha: string;
  UsuarioSQL: string;
  Registro: string;
}

function aFrontend(b: BitacoraBD): RegistroBitacora {
  return {
    id: b.IdBita,
    tabla: b.Tabla,
    accion: b.Accion,
    fecha: b.Fecha,
    usuarioSql: b.UsuarioSQL,
    registro: b.Registro,
  };
}

export const bitacoraService = {
  async listar(tabla?: string): Promise<RegistroBitacora[]> {
    const { data } = await api.get<BitacoraBD[]>("/bitacora", {
      params: tabla ? { tabla } : undefined,
    });
    return data.map(aFrontend);
  },
};
