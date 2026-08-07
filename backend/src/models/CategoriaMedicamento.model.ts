import sql from 'mssql';
import poolPromise from '../config/db';
import { CategoriaMedicamento } from '../types';

export const insertCategoriaMedicamento = async (data: CategoriaMedicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('NombreCategoria', sql.VarChar(100), data.NombreCategoria)
    .input('Comentario', sql.VarChar(300), data.Comentario ?? null)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('InsertCategoriaMedicamento');
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

export const updateCategoriaMedicamento = async (id: number, data: CategoriaMedicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdCategoria', sql.Int, id)
    .input('NombreCategoria', sql.VarChar(100), data.NombreCategoria)
    .input('Comentario', sql.VarChar(300), data.Comentario ?? null)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .execute('UpdateCategoriaMedicamento');
};

export const camEstadoCategoriaMedicamento = async (id: number, estado: 'A' | 'I') => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdCategoria', sql.Int, id)
    .input('Estado', sql.Char(1), estado)
    .execute('CamEstadoCategoriaMedicamento');
};
