import sql from 'mssql';
import poolPromise from '../config/db';
import { Usuario } from '../types';

export const insertUsuario = async (data: Usuario) => {
  const pool = await poolPromise;
  await pool.request()
    .input('Nombre', sql.VarChar(50), data.Nombre)
    .input('Apellido1', sql.VarChar(50), data.Apellido1)
    .input('Apellido2', sql.VarChar(50), data.Apellido2 ?? null)
    .input('Ident', sql.VarChar(25), data.Ident)
    .input('Telefono', sql.VarChar(20), data.Telefono ?? null)
    .input('Correo', sql.VarChar(100), data.Correo)
    .input('NombreUsuario', sql.VarChar(50), data.NombreUsuario)
    .input('Contrasena', sql.VarChar(255), data.Contrasena)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .input('IdRol', sql.Int, data.IdRol)
    .execute('InsertUsuario');
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

export const updateUsuario = async (id: number, data: Usuario) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdUsuario', sql.Int, id)
    .input('Nombre', sql.VarChar(50), data.Nombre)
    .input('Apellido1', sql.VarChar(50), data.Apellido1)
    .input('Apellido2', sql.VarChar(50), data.Apellido2 ?? null)
    .input('Ident', sql.VarChar(25), data.Ident)
    .input('Telefono', sql.VarChar(20), data.Telefono ?? null)
    .input('Correo', sql.VarChar(100), data.Correo)
    .input('NombreUsuario', sql.VarChar(50), data.NombreUsuario)
    .input('Contrasena', sql.VarChar(255), data.Contrasena)
    .input('Estado', sql.Char(1), data.Estado)
    .input('IdRol', sql.Int, data.IdRol)
    .execute('UpdateUsuario');
};

export const camEstadoUsuario = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdUsuario', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoUsuario');
};