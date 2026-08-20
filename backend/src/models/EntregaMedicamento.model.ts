import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { EntregaMedicamento } from '../types';

export const insertEntregaMedicamento = async (data: EntregaMedicamento, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertEntregaMedicamento', [
    { name: 'IdReceta', type: sql.Int, value: data.IdReceta },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectEntregaMedicamento = async (): Promise<EntregaMedicamento[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectEntregaMedicamento');
  return result.recordset;
};

export const selectEntregaMedicamentoById = async (id: number): Promise<EntregaMedicamento | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdEntrega', sql.Int, id).execute('SelectEntregaMedicamentoById');
  return result.recordset[0];
};

export const updateEntregaMedicamento = async (id: number, data: EntregaMedicamento, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateEntregaMedicamento', [
    { name: 'IdEntrega', type: sql.Int, value: id },
    { name: 'IdReceta', type: sql.Int, value: data.IdReceta },
    { name: 'IdUsuario', type: sql.Int, value: data.IdUsuario },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoEntregaMedicamento = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoEntregaMedicamento', [
    { name: 'IdEntrega', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};