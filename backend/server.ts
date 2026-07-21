import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import poolPromise from './src/config/db';
import apiRoutes from './src/routes/index';

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});