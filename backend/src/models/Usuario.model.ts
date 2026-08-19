import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Usuario } from '../types';

export const insertUsuario = async (data: Usuario, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertUsuario', [
    { name: 'Nombre', type: sql.VarChar(50), value: data.Nombre },
    { name: 'Apellido1', type: sql.VarChar(50), value: data.Apellido1 },
    { name: 'Apellido2', type: sql.VarChar(50), value: data.Apellido2 ?? null },
    { name: 'Ident', type: sql.VarChar(25), value: data.Ident },
    { name: 'Telefono', type: sql.VarChar(20), value: data.Telefono ?? null },
    { name: 'Correo', type: sql.VarChar(100), value: data.Correo },
    { name: 'NombreUsuario', type: sql.VarChar(50), value: data.NombreUsuario },
    { name: 'Contrasena', type: sql.VarChar(255), value: data.Contrasena },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
    { name: 'IdRol', type: sql.Int, value: data.IdRol },
  ]);
};

export const selectUsuario = async (): Promise<Usuario[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectUsuario');
  return result.recordset;
};

export const selectUsuarioById = async (id: number): Promise<Usuario | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdUsuario', sql.Int, id).execute('SelectUsuarioById');
  return result.recordset[0];
};

export const updateUsuario = async (id: number, data: Usuario, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateUsuario', [
    { name: 'IdUsuario', type: sql.Int, value: id },
    { name: 'Nombre', type: sql.VarChar(50), value: data.Nombre },
    { name: 'Apellido1', type: sql.VarChar(50), value: data.Apellido1 },
    { name: 'Apellido2', type: sql.VarChar(50), value: data.Apellido2 ?? null },
    { name: 'Ident', type: sql.VarChar(25), value: data.Ident },
    { name: 'Telefono', type: sql.VarChar(20), value: data.Telefono ?? null },
    { name: 'Correo', type: sql.VarChar(100), value: data.Correo },
    { name: 'NombreUsuario', type: sql.VarChar(50), value: data.NombreUsuario },
    { name: 'Contrasena', type: sql.VarChar(255), value: data.Contrasena },
    { name: 'Estado', type: sql.Char(1), value: data.Estado },
    { name: 'IdRol', type: sql.Int, value: data.IdRol },
  ]);
};

export const camEstadoUsuario = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoUsuario', [
    { name: 'IdUsuario', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};