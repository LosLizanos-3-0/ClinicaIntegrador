import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { CategoriaMedicamento } from '../types';

export const insertCategoriaMedicamento = async (data: CategoriaMedicamento, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertCategoriaMedicamento', [
    { name: 'NombreCategoria', type: sql.VarChar(100), value: data.NombreCategoria },
    { name: 'Comentario', type: sql.VarChar(300), value: data.Comentario ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectCategoriaMedicamento = async (): Promise<CategoriaMedicamento[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectCategoriaMedicamento');
  return result.recordset;
};

export const selectCategoriaMedicamentoById = async (id: number): Promise<CategoriaMedicamento | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdCategoria', sql.Int, id).execute('SelectCategoriaMedicamentoById');
  return result.recordset[0];
};

export const updateCategoriaMedicamento = async (id: number, data: CategoriaMedicamento, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateCategoriaMedicamento', [
    { name: 'IdCategoria', type: sql.Int, value: id },
    { name: 'NombreCategoria', type: sql.VarChar(100), value: data.NombreCategoria },
    { name: 'Comentario', type: sql.VarChar(300), value: data.Comentario ?? null },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoCategoriaMedicamento = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoCategoriaMedicamento', [
    { name: 'IdCategoria', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};