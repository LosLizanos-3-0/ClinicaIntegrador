import { Request, Response } from 'express';
import * as FacturaModel from '../models/Factura.model';
import * as PacienteModel from '../models/Paciente.model';
import * as BoricuasService from '../services/Boricuas.service';

const CLINICA_NOMBRE = 'CliniSoft';

function manejarError(error: any, res: Response) {
  console.error(error);
  if (error?.detalle) {
    return res.status(error.status || 502).json(error.detalle);
  }
  res.status(error?.status || 500).json({ mensaje: error?.message || 'Error al procesar la solicitud' });
}

export const crearVentaDesdeFactura = async (req: Request, res: Response) => {
  try {
    const idFactura = Number(req.params.id);
    const factura = await FacturaModel.selectFacturaById(idFactura);
    if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' });

    const paciente = await PacienteModel.selectPacienteById(factura.IdPaciente);
    if (!paciente) return res.status(404).json({ mensaje: 'El paciente de esta factura ya no existe' });

    const nombreCompleto = [paciente.Nombre, paciente.Apellido1, paciente.Apellido2].filter(Boolean).join(' ');
    const monto = factura.Total ?? factura.MontoConsulta ?? 0;

    const venta = await BoricuasService.crearVenta({
      referenciaExterna: `FACT-${idFactura}`,
      clienteNombre: nombreCompleto,
      clienteIdentificacion: paciente.Cedula,
      clienteCorreo: paciente.Correo,
      detalle: `Consulta médica ${CLINICA_NOMBRE} - Factura ${idFactura}`,
      monto,
    });

    res.status(201).json(venta);
  } catch (error) {
    manejarError(error, res);
  }
};

export const firmarVenta = async (req: Request, res: Response) => {
  try {
    const idVenta = Number(req.params.idVenta);
    const { xmlFirmado, hashDocumento, serialCertificado } = req.body;
    if (!xmlFirmado) return res.status(400).json({ mensaje: 'xmlFirmado es obligatorio' });

    const resultado = await BoricuasService.firmarVenta(idVenta, {
      xmlFirmado,
      hashDocumento,
      serialCertificado,
    });

    res.json(resultado);
  } catch (error) {
    manejarError(error, res);
  }
};

export const obtenerVenta = async (req: Request, res: Response) => {
  try {
    const venta = await BoricuasService.consultarVenta(Number(req.params.idVenta));
    res.json(venta);
  } catch (error) {
    manejarError(error, res);
  }
};
