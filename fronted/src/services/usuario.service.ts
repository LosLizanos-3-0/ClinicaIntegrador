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
  correo: string;
  rol: string;
  estado: "Activo" | "Inactivo";
  especialidadId?: number;
  nombreUsuario: string;
  ident: string;
}

function separarNombre(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(" ").filter(Boolean);
  return {
    Nombre: partes[0] ?? "",
    Apellido1: partes[1] ?? "",
    Apellido2: partes.slice(2).join(" ") || null,
  };
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
      const nombreCompleto = `${u.Nombre} ${u.Apellido1} ${u.Apellido2 ?? ""}`.trim();
      return {
        id: u.IdUsuario,
        nombre: nombreCompleto,
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
    const { Nombre, Apellido1, Apellido2 } = separarNombre(datos.nombre);

    await api.post("/usuarios", {
      Nombre, Apellido1, Apellido2,
      Ident: datos.ident,
      Telefono: null,
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
    const { Nombre, Apellido1, Apellido2 } = separarNombre(datos.nombre);

    await api.put(`/usuarios/${id}`, {
      Nombre, Apellido1, Apellido2,
      Ident: datos.ident,
      Telefono: actualRes.data.Telefono,
      Correo: datos.correo,
      NombreUsuario: datos.nombreUsuario,
      Contrasena: actualRes.data.Contrasena, // se mantiene la actual
      Estado: datos.estado === "Activo" ? "A" : "I",
      IdRol: rolBD.IdRol,
    });
  },

  async cambiarEstado(id: number, datosActuales: DatosUsuarioForm) {
    await usuarioService.actualizar(id, {
      ...datosActuales,
      estado: datosActuales.estado === "Activo" ? "Inactivo" : "Activo",
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