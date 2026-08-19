import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Rol } from '../types';

export const insertRol = async (data: Rol, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertRol', [
    { name: 'Cita', type: sql.Bit, value: data.cita },
    { name: 'NombreRol', type: sql.VarChar(50), value: data.NombreRol },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectRol = async (): Promise<Rol[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectRol');
  return result.recordset;
};

export const selectRolById = async (id: number): Promise<Rol | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdRol', sql.Int, id).execute('SelectRolById');
  return result.recordset[0];
};

export const updateRol = async (id: number, data: Rol, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateRol', [
    { name: 'IdRol', type: sql.Int, value: id },
    { name: 'Cita', type: sql.Bit, value: data.cita },
    { name: 'NombreRol', type: sql.VarChar(50), value: data.NombreRol },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoRol = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoRol', [
    { name: 'IdRol', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};