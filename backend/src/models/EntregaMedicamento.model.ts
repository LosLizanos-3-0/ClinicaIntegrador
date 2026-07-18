import sql from 'mssql';
import poolPromise from '../config/db';
import { EntregaMedicamento } from '../types';

export const insertEntregaMedicamento = async (data: EntregaMedicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdReceta', sql.Int, data.IdReceta)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .execute('InsertEntregaMedicamento');
};

export const selectEntregaMedicamento = async (): Promise<EntregaMedicamento[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectEntregaMedicamento');
  return result.recordset;
};

export const selectEntregaMedicamentoById = async (id: number): Promise<EntregaMedicamento | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdEntrega', sql.Int, id)
    .execute('SelectEntregaMedicamentoById');
  return result.recordset[0];
};

export const updateEntregaMedicamento = async (id: number, data: EntregaMedicamento) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdEntrega', sql.Int, id)
    .input('IdReceta', sql.Int, data.IdReceta)
    .input('IdUsuario', sql.Int, data.IdUsuario)
    .execute('UpdateEntregaMedicamento');
};

export const deleteEntregaMedicamento = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdEntrega', sql.Int, id)
    .execute('DeleteEntregaMedicamento');
};