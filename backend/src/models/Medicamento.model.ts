import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Medicamento, MedicamentoUpdate } from '../types';

export const insertMedicamento = async (data: Medicamento, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertMedicamento', [
    { name: 'NombreMedicamento', type: sql.VarChar(100), value: data.NombreMedicamento },
    { name: 'Descripcion', type: sql.VarChar(300), value: data.Descripcion ?? null },
    { name: 'IdCategoria', type: sql.Int, value: data.IdCategoria },
    { name: 'Presentacion', type: sql.VarChar(50), value: data.Presentacion ?? null },
    { name: 'Ubicacion', type: sql.VarChar(200), value: data.Ubicacion },
    { name: 'StockActual', type: sql.Int, value: data.StockActual ?? 0 },
    { name: 'StockMinimo', type: sql.Int, value: data.StockMinimo ?? 0 },
    { name: 'PrecioUnitario', type: sql.Decimal(10, 2), value: data.PrecioUnitario ?? 0 },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const selectMedicamento = async (): Promise<Medicamento[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectMedicamento');
  return result.recordset;
};

export const selectMedicamentoById = async (id: number): Promise<Medicamento | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdMedicamento', sql.Int, id).execute('SelectMedicamentoById');
  return result.recordset[0];
};

export const updateMedicamento = async (id: number, data: MedicamentoUpdate, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateMedicamento', [
    { name: 'IdMedicamento', type: sql.Int, value: id },
    { name: 'NombreMedicamento', type: sql.VarChar(100), value: data.NombreMedicamento },
    { name: 'Descripcion', type: sql.VarChar(300), value: data.Descripcion ?? null },
    { name: 'IdCategoria', type: sql.Int, value: data.IdCategoria },
    { name: 'Presentacion', type: sql.VarChar(50), value: data.Presentacion ?? null },
    { name: 'Ubicacion', type: sql.VarChar(200), value: data.Ubicacion },
    { name: 'StockMinimo', type: sql.Int, value: data.StockMinimo },
    { name: 'PrecioUnitario', type: sql.Decimal(10, 2), value: data.PrecioUnitario },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
  ]);
};

export const camEstadoMedicamento = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoMedicamento', [
    { name: 'IdMedicamento', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};

// Actualiza únicamente el stock actual. Es un procedimiento aparte y
// exclusivo, pensado para que solo el rol Administrador lo invoque
// (la validación de rol se hace en el controlador).
export const updateStockMedicamento = async (id: number, stockActual: number, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdateStockMedicamento', [
    { name: 'IdMedicamento', type: sql.Int, value: id },
    { name: 'StockActual', type: sql.Int, value: stockActual },
  ]);
};