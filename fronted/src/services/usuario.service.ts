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
      // Un médico puede tener varias especialidades: se recogen TODAS
      // las relaciones que le correspondan, no solo la primera.
      const especialidadIds = relaciones
        .filter((r) => r.IdUsuario === u.IdUsuario)
        .map((r) => r.IdEspecialidad);
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
        especialidadIds,
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
    // La asignación de especialidad(es) del médico se hace después,
    // desde Gestión de especialidades — no en este formulario.
  },

  // actorId: id del usuario con sesión iniciada que realiza la edición.
  // El backend lo usa para aplicar las reglas de protección entre
  // administradores (nadie se edita a sí mismo, y solo el admin principal
  // puede editar a otros administradores).
  async actualizar(id: number, datos: DatosUsuarioForm, actorId?: number) {
    const [roles, actualRes] = await Promise.all([
      rolService.listar(),
      api.get<UsuarioBD>(`/usuarios/${id}`),
    ]);
    const rolBD = roles.find((r) => r.NombreRol === datos.rol);
    if (!rolBD) throw new Error(`No existe el rol "${datos.rol}" en la base de datos.`);

    await api.put(
      `/usuarios/${id}`,
      {
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
      },
      actorId ? { headers: { "x-usuario-id": String(actorId) } } : undefined
    );
  },

  async cambiarEstado(id: number, estadoActual: "Activo" | "Inactivo", actorId?: number) {
    await api.patch(
      `/usuarios/${id}/estado`,
      { Estado: estadoActual === "Activo" ? "I" : "A" },
      actorId ? { headers: { "x-usuario-id": String(actorId) } } : undefined
    );
  },

  // Solo agrega la relación — NO borra las especialidades que el médico
  // ya tenía, para permitir que tenga varias a la vez.
  async asignarEspecialidad(idUsuario: number, idEspecialidad: number) {
    await api.post("/usuario-especialidad", { IdUsuario: idUsuario, IdEspecialidad: idEspecialidad });
  },

  // Si se pasa idEspecialidad, quita solo esa relación puntual.
  // Si se omite, quita todas (comportamiento heredado, por compatibilidad).
  async quitarEspecialidad(idUsuario: number, idEspecialidad?: number) {
    if (idEspecialidad !== undefined) {
      await api.delete(`/usuario-especialidad/${idUsuario}/${idEspecialidad}`);
      return;
    }
    const { data: relaciones } = await api.get<UsuarioEspecialidadBD[]>(`/usuario-especialidad/usuario/${idUsuario}`);
    for (const rel of relaciones) {
      await api.delete(`/usuario-especialidad/${idUsuario}/${rel.IdEspecialidad}`);
    }
  },
};