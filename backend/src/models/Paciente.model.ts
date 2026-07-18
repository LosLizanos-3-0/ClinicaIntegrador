import sql from 'mssql';
import poolPromise from '../config/db';
import { Paciente } from '../types';

export const insertPaciente = async (data: Paciente) => {
  const pool = await poolPromise;
  await pool.request()
    .input('Nombre', sql.VarChar(50), data.Nombre)
    .input('Apellido1', sql.VarChar(50), data.Apellido1)
    .input('Apellido2', sql.VarChar(50), data.Apellido2 ?? null)
    .input('Cedula', sql.VarChar(25), data.Cedula)
    .input('FechaNacimiento', sql.Date, data.FechaNacimiento)
    .input('Estado', sql.Char(1), data.Estado ?? 'A')
    .input('Sexo', sql.VarChar(15), data.Sexo)
    .input('Telefono', sql.VarChar(20), data.Telefono ?? null)
    .input('Correo', sql.VarChar(100), data.Correo ?? null)
    .input('Direccion', sql.VarChar(200), data.Direccion ?? null)
    .execute('InsertPaciente');
};

export const selectPaciente = async (): Promise<Paciente[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectPaciente');
  return result.recordset;
};

export const selectPacienteById = async (id: number): Promise<Paciente | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdPaciente', sql.Int, id)
    .execute('SelectPacienteById');
  return result.recordset[0];
};

export const updatePaciente = async (id: number, data: Paciente) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPaciente', sql.Int, id)
    .input('Nombre', sql.VarChar(50), data.Nombre)
    .input('Apellido1', sql.VarChar(50), data.Apellido1)
    .input('Apellido2', sql.VarChar(50), data.Apellido2 ?? null)
    .input('Cedula', sql.VarChar(25), data.Cedula)
    .input('FechaNacimiento', sql.Date, data.FechaNacimiento)
    .input('Estado', sql.Char(1), data.Estado)
    .input('Sexo', sql.VarChar(15), data.Sexo)
    .input('Telefono', sql.VarChar(20), data.Telefono ?? null)
    .input('Correo', sql.VarChar(100), data.Correo ?? null)
    .input('Direccion', sql.VarChar(200), data.Direccion ?? null)
    .execute('UpdatePaciente');
};

export const deletePaciente = async (id: number) => {
  const pool = await poolPromise;
  await pool.request()
    .input('IdPaciente', sql.Int, id)
    .execute('DeletePaciente');
};