import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import poolPromise from './src/config/db';
import apiRoutes from './src/routes/index';
import * as RolModel from './src/models/Rol.model';
import * as UsuarioModel from './src/models/Usuario.model';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 + 1 AS resultado');
    res.json({ mensaje: 'Conexión exitosa', resultado: result.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

// ─── Precarga del rol y usuario Administrador ──────────────────────────────
// Se ejecuta cada vez que arranca el servidor. Es idempotente: si el rol o el
// usuario ya existen (porque el sistema ya se corrió antes), NO se vuelven a
// crear ni se duplican.
async function seedAdministrador() {
  try {
    const roles = await RolModel.selectRol();
    let rolAdmin = roles.find((r) => r.NombreRol === 'Administrador');

    if (!rolAdmin) {
      await RolModel.insertRol({ cita: false, NombreRol: 'Administrador', Estado: 'A' });
      const rolesActualizados = await RolModel.selectRol();
      rolAdmin = rolesActualizados.find((r) => r.NombreRol === 'Administrador');
      console.log('✔ Rol "Administrador" creado automáticamente.');
    }

    if (!rolAdmin || !rolAdmin.IdRol) {
      console.error('✘ No se pudo crear/encontrar el rol Administrador. Se omite el usuario admin.');
      return;
    }

    const usuarios = await UsuarioModel.selectUsuario();
    const yaExiste = usuarios.some(
      (u) =>
        u.NombreUsuario.toLowerCase() === 'admin' ||
        u.Correo.toLowerCase() === 'admin@gmail.com' ||
        u.Ident === '3-3244-4432'
    );

    if (yaExiste) {
      console.log('ℹ El usuario administrador ya existe, no se vuelve a crear.');
      return;
    }

    const hash = await bcrypt.hash('123', 10);
    await UsuarioModel.insertUsuario({
      Nombre: 'Juan',
      Apellido1: 'Venegas',
      Apellido2: 'Tellez',
      Ident: '3-3244-4432',
      Telefono: '6475-8465',
      Correo: 'admin@gmail.com',
      NombreUsuario: 'admin',
      Contrasena: hash,
      Estado: 'A',
      IdRol: rolAdmin.IdRol,
    });
    console.log('✔ Usuario administrador "Juan Venegas Tellez" (admin / 123) creado automáticamente.');
  } catch (error) {
    console.error('✘ Error al verificar/crear el rol y usuario administrador por defecto:', error);
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  await seedAdministrador();
});