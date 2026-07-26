import api from "./api";
import { rolService } from "./rol.service";
import type { UsuarioClinica } from "../types/clinicaStore";

interface UsuarioBD {
  IdUsuario: number;
  Nombre: string;
  Apellido1: string;
  Apellido2: string | null;
  Ident: string;
  Telefono: string | null;
  Correo: string;
  NombreUsuario: string;
  Contrasena: string;
  Estado: "A" | "I";
  FechaCreacion: string;
  IdRol: number;
}

interface UsuarioEspecialidadBD {
  IdUsuario: number;
  IdEspecialidad: number;
}

export interface DatosUsuarioForm {
  nombre: string;
  apellido1: string;
  apellido2?: string;
  telefono?: string;
  correo: string;
  rol: string;
  estado: "Activo" | "Inactivo";
  especialidadId?: number;
  nombreUsuario: string;
  ident: string;
}

export const usuarioService = {
  async listarConEspecialidad(): Promise<UsuarioClinica[]> {
    const [usuariosRes, roles, ueRes] = await Promise.all([
      api.get<UsuarioBD[]>("/usuarios"),
      rolService.listar(),
      api.get<UsuarioEspecialidadBD[]>("/usuario-especialidad"),
    ]);
    const relaciones = ueRes.data;

    return usuariosRes.data.map((u) => {
      const rolNombre = roles.find((r) => r.IdRol === u.IdRol)?.NombreRol ?? "Sin rol";
      const especialidadId = relaciones.find((r) => r.IdUsuario === u.IdUsuario)?.IdEspecialidad;
      return {
        id: u.IdUsuario,
        nombre: u.Nombre,
        apellido1: u.Apellido1,
        apellido2: u.Apellido2 ?? undefined,
        telefono: u.Telefono ?? undefined,
        correo: u.Correo,
        rol: rolNombre as UsuarioClinica["rol"],
        estado: u.Estado === "A" ? "Activo" : "Inactivo",
        ingreso: new Date(u.FechaCreacion).toLocaleDateString("es-CR"),
        iniciales: `${u.Nombre[0] ?? ""}${u.Apellido1[0] ?? ""}`.toUpperCase(),
        especialidadId,
        nombreUsuario: u.NombreUsuario,
        ident: u.Ident,
      };
    });
  },

  async crear(datos: DatosUsuarioForm & { contrasena: string }) {
    const roles = await rolService.listar();
    const rolBD = roles.find((r) => r.NombreRol === datos.rol);
    if (!rolBD) throw new Error(`No existe el rol "${datos.rol}" en la base de datos.`);

    await api.post("/usuarios", {
      Nombre: datos.nombre,
      Apellido1: datos.apellido1,
      Apellido2: datos.apellido2 || null,
      Ident: datos.ident,
      Telefono: datos.telefono || null,
      Correo: datos.correo,
      NombreUsuario: datos.nombreUsuario,
      Contrasena: datos.contrasena,
      Estado: datos.estado === "Activo" ? "A" : "I",
      IdRol: rolBD.IdRol,
    });

    if (datos.especialidadId) {
      const { data: usuarios } = await api.get<UsuarioBD[]>("/usuarios");
      const creado = usuarios.sort((a, b) => b.IdUsuario - a.IdUsuario)[0];
      await api.post("/usuario-especialidad", { IdUsuario: creado.IdUsuario, IdEspecialidad: datos.especialidadId });
    }
  },

  async actualizar(id: number, datos: DatosUsuarioForm) {
    const [roles, actualRes] = await Promise.all([
      rolService.listar(),
      api.get<UsuarioBD>(`/usuarios/${id}`),
    ]);
    const rolBD = roles.find((r) => r.NombreRol === datos.rol);
    if (!rolBD) throw new Error(`No existe el rol "${datos.rol}" en la base de datos.`);

    await api.put(`/usuarios/${id}`, {
      Nombre: datos.nombre,
      Apellido1: datos.apellido1,
      Apellido2: datos.apellido2 || null,
      Ident: datos.ident,
      Telefono: datos.telefono || null,
      Correo: datos.correo,
      NombreUsuario: datos.nombreUsuario,
      Contrasena: actualRes.data.Contrasena,
      Estado: datos.estado === "Activo" ? "A" : "I",
      IdRol: rolBD.IdRol,
    });
  },

  async cambiarEstado(id: number, estadoActual: "Activo" | "Inactivo") {
    await api.patch(`/usuarios/${id}/estado`, {
      Estado: estadoActual === "Activo" ? "I" : "A",
    });
  },

  async asignarEspecialidad(idUsuario: number, idEspecialidad: number) {
    await usuarioService.quitarEspecialidad(idUsuario);
    await api.post("/usuario-especialidad", { IdUsuario: idUsuario, IdEspecialidad: idEspecialidad });
  },

  async quitarEspecialidad(idUsuario: number) {
    const { data: relaciones } = await api.get<UsuarioEspecialidadBD[]>(`/usuario-especialidad/usuario/${idUsuario}`);
    for (const rel of relaciones) {
      await api.delete(`/usuario-especialidad/${idUsuario}/${rel.IdEspecialidad}`);
    }
  },
};