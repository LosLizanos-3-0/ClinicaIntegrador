import { Request, Response } from 'express';
import * as UsuarioModel from '../models/Usuario.model';

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    res.json(await UsuarioModel.selectUsuario());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const usuario = await UsuarioModel.selectUsuarioById(Number(req.params.id));
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    await UsuarioModel.insertUsuario(req.body);
    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    await UsuarioModel.updateUsuario(Number(req.params.id), req.body);
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

export const cambiarEstadoUsuario = async (req: Request, res: Response) => {
  try {
    await UsuarioModel.camEstadoUsuario(Number(req.params.id), req.body.Estado);
    res.json({ mensaje: 'Estado del usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
  }
};