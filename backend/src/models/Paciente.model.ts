import sql from 'mssql';
import poolPromise from '../config/db';
import { ejecutarConActor, ActorInfo } from '../config/actor';
import { Paciente } from '../types';

export const insertPaciente = async (data: Paciente, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'InsertPaciente', [
    { name: 'Nombre', type: sql.VarChar(50), value: data.Nombre },
    { name: 'Apellido1', type: sql.VarChar(50), value: data.Apellido1 },
    { name: 'Apellido2', type: sql.VarChar(50), value: data.Apellido2 ?? null },
    { name: 'Cedula', type: sql.VarChar(25), value: data.Cedula },
    { name: 'FechaNacimiento', type: sql.Date, value: data.FechaNacimiento },
    { name: 'Estado', type: sql.Char(1), value: data.Estado ?? 'A' },
    { name: 'Sexo', type: sql.VarChar(15), value: data.Sexo },
    { name: 'Telefono', type: sql.VarChar(20), value: data.Telefono ?? null },
    { name: 'Correo', type: sql.VarChar(100), value: data.Correo ?? null },
    { name: 'Direccion', type: sql.VarChar(200), value: data.Direccion ?? null },
  ]);
};

export const selectPaciente = async (): Promise<Paciente[]> => {
  const pool = await poolPromise;
  const result = await pool.request().execute('SelectPaciente');
  return result.recordset;
};

export const selectPacienteById = async (id: number): Promise<Paciente | undefined> => {
  const pool = await poolPromise;
  const result = await pool.request().input('IdPaciente', sql.Int, id).execute('SelectPacienteById');
  return result.recordset[0];
};

export const buscarPacientePorNombre = async (nombre: string): Promise<Paciente[]> => {
  const pool = await poolPromise;
  const result = await pool.request().input('Nombre', sql.VarChar(50), nombre).execute('BuscarPacientePorNombre');
  return result.recordset;
};

export const updatePaciente = async (id: number, data: Paciente, actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'UpdatePaciente', [
    { name: 'IdPaciente', type: sql.Int, value: id },
    { name: 'Nombre', type: sql.VarChar(50), value: data.Nombre },
    { name: 'Apellido1', type: sql.VarChar(50), value: data.Apellido1 },
    { name: 'Apellido2', type: sql.VarChar(50), value: data.Apellido2 ?? null },
    { name: 'Cedula', type: sql.VarChar(25), value: data.Cedula },
    { name: 'FechaNacimiento', type: sql.Date, value: data.FechaNacimiento },
    { name: 'Estado', type: sql.Char(1), value: data.Estado },
    { name: 'Sexo', type: sql.VarChar(15), value: data.Sexo },
    { name: 'Telefono', type: sql.VarChar(20), value: data.Telefono ?? null },
    { name: 'Correo', type: sql.VarChar(100), value: data.Correo ?? null },
    { name: 'Direccion', type: sql.VarChar(200), value: data.Direccion ?? null },
  ]);
};

export const camEstadoPaciente = async (id: number, estado: 'A' | 'I', actor: ActorInfo | null = null) => {
  await ejecutarConActor(actor, 'CamEstadoPaciente', [
    { name: 'IdPaciente', type: sql.Int, value: id },
    { name: 'Estado', type: sql.Char(1), value: estado },
  ]);
};