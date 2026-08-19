import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { UsuarioEspecialidad } from '../types';

export const insertUsuarioEspecialidad = async (data: UsuarioEspecialidad, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertUsuarioEspecialidad', [
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'IdEspecialidad', type: sql.Int, value: data.IdEspecialidad },
  ]);
};

export const selectUsuarioEspecialidad = async (): Promise<UsuarioEspecialidad[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectUsuarioEspecialidad');
  return result.recordset;
};

export const selectUsuarioEspecialidadByUsuario = async (idUsuario: number): Promise<UsuarioEspecialidad[]> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdUsuario', sql.Int, idUsuario).execute('SelectUsuarioEspecialidadByUsuario');
  return result.recordset;
};

export const deleteUsuarioEspecialidad = async (
  idUsuario: number,
  idEspecialidad: number,
  actor: ActorInfo | null = null
) => {
  await ejecutarConActor(actor, 'DeleteUsuarioEspecialidad', [
    { name: 'IdUsuario', type: sql.Int, value: idUsuario },
    { name: 'IdEspecialidad', type: sql.Int, value: idEspecialidad },
  ]);
};