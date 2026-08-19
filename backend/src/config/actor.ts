import sql from 'mssql';
import poolPromise from './db';

export interface ActorInfo {
  nombre: string; // "Nombre Apellido1"
  rol: string;
}

// Identifica quién está haciendo la solicitud a partir del header
// "x-usuario-id" (id del usuario con sesión iniciada en el frontend).
// Devuelve null si no viene el header o el usuario no existe.
export async function obtenerActor(req: { header: (name: string) => string | undefined }): Promise<ActorInfo | null> {
  const idHeader = req.header('x-usuario-id');
  const actorId = Number(idHeader);
  if (!idHeader || !Number.isFinite(actorId) || actorId <= 0) return null;

  const pool = await poolPromise;
  const result = await pool.request()
    .input('IdUsuario', sql.Int, actorId)
    .query(`
      SELECT TOP 1 u.Nombre, u.Apellido1, r.NombreRol
      FROM Usuario u
      LEFT JOIN Rol r ON r.IdRol = u.IdRol
      WHERE u.IdUsuario = @IdUsuario
    `);
  const row = result.recordset[0];
  if (!row) return null;
  return { nombre: `${row.Nombre} ${row.Apellido1}`.trim(), rol: row.NombreRol ?? '' };
}

// Ejecuta un procedimiento almacenado dejando registrado, en la MISMA
// conexión/sesión de SQL Server, quién es el actor (sp_set_session_context).
// Los triggers automáticos de bitácora leen ese valor (SESSION_CONTEXT) y
// lo usan en vez de "sa" (SUSER_SNAME()) cuando está disponible.
// IMPORTANTE: todo va en una sola llamada .query() (un solo viaje de red)
// para garantizar que se ejecuta en la misma conexión física.
export async function ejecutarConActor(
  actor: ActorInfo | null,
  procName: string,
  inputs: { name: string; type: any; value: any }[]
): Promise<sql.IResult<any>> {
  const pool = await poolPromise;
  const request = pool.request();

  let sqlText = '';
  if (actor) {
    request.input('__ActorNombre', sql.VarChar(100), actor.nombre);
    request.input('__ActorRol', sql.VarChar(50), actor.rol);
    sqlText += `EXEC sp_set_session_context @key = N'ActorNombre', @value = @__ActorNombre;\n`;
    sqlText += `EXEC sp_set_session_context @key = N'ActorRol', @value = @__ActorRol;\n`;
  }

  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  const execParams = inputs.map((i) => `@${i.name} = @${i.name}`).join(', ');
  sqlText += `EXEC ${procName} ${execParams};`;

  return request.query(sqlText);
}