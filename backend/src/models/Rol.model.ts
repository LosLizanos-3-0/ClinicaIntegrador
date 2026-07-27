import sql from 'mssql';
import poolPromise from '../config/db';
import { Rol } from '../types';

export const insertRol = async (data: Rol) => {
  const pool = await poolPromise;
  await pool.request()
    .input('cita', sql.Bit, data.cita)
    .input('NombreRol', sql.VarChar(50), data.NombreRol)
    .execute('InsertRol');
};

export const selectRol = async (): Promise<Rol[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectRol');
  return result.recordset;
};

export const selectRolById = async (id: number): Promise<Rol | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdRol', sql.Int, id)
    .execute('SelectRolById');
  return result.recordset[0];
};

export const updateRol = async (id: number, data: Rol) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdRol', sql.Int, id)
    .input('Cita', sql.Bit, data.cita)
    .input('NombreRol', sql.VarChar(50), data.NombreRol)
    .execute('UpdateRol');
};

export const deleteRol = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdRol', sql.Int, id)
    .execute('DeleteRol');
};