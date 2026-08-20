import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Receta } from '../types';

export const insertReceta = async (data: Receta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertReceta', [
    { name: 'IdConsulta', type: sql.Int, value: data.IdConsulta },
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado ?? 'Pendiente' },
  ]);
};

export const selectReceta = async (): Promise<Receta[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectReceta');
  return result.recordset;
};

export const selectRecetaById = async (id: number): Promise<Receta | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdReceta', sql.Int, id).execute('SelectRecetaById');
  return result.recordset[0];
};

export const updateReceta = async (id: number, data: Receta, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateReceta', [
    { name: 'IdReceta', type: sql.Int, value: id },
    { name: 'IdConsulta', type: sql.Int, value: data.IdConsulta },
    { name: 'IdPaciente', type: sql.Int, value: data.IdPaciente },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Estado', type: sql.VarChar(20), value: data.Estado },
  ]);
};

export const camEstadoReceta = async (id: number, estado: string, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoReceta', [
    { name: 'IdReceta', type: sql.Int, value: id },
    { name: 'Estado', type: sql.VarChar(20), value: estado },
  ]);
};