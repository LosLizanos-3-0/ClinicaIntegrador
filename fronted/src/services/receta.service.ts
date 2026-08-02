import api from "./api";
import type { Paciente } from "../types/clinica.types";
import type { UsuarioClinica, EspecialidadClinica } from "../types/clinicaStore";
import type { DetalleRecetaBD } from "./detalleReceta.service";
import type { Medicamento, Receta, EstadoReceta } from "../types/clinica.types";

export interface RecetaBD {
  IdReceta: number;
  IdConsulta: number;
  IdPaciente: number;
  IdUsuario: number;
  FechaEmision: string;
  Estado: EstadoReceta;
}

export const recetaService = {
  async crear(datos: {
    IdConsulta: number;
    IdPaciente: number;
    IdUsuario: number;
    items: { IdMedicamento: number; Cantidad: number; Indicaciones?: string }[];
  }): Promise<void> {
    await api.post("/recetas", {
      IdConsulta: datos.IdConsulta,
      IdPaciente: datos.IdPaciente,
      IdUsuario: datos.IdUsuario,
    });
    const { data: recetas } = await api.get<RecetaBD[]>("/recetas");
    const creada = recetas.sort((a, b) => b.IdReceta - a.IdReceta)[0];

    for (const item of datos.items) {
      await api.post("/detalle-receta", {
        IdReceta: creada.IdReceta,
        IdMedicamento: item.IdMedicamento,
        Cantidad: item.Cantidad,
        Indicaciones: item.Indicaciones || null,
      });
    }
  },

  // Cambia el estado de la receta (Pendiente | Despachada | Anulada)
  async camEstado(idReceta: number, estado: EstadoReceta): Promise<void> {
    await api.patch(`/recetas/${idReceta}/estado`, { Estado: estado });
  },

  // Trae recetas + detalle + arma el shape que usa el frontend (ConsultaRecetas.tsx)
  async listar(
    pacientes: Paciente[],
    usuarios: UsuarioClinica[],
    especialidades: EspecialidadClinica[],
    medicamentos: Medicamento[]
  ): Promise<Receta[]> {
    const [recetasBD, detallesBD] = await Promise.all([
      api.get<RecetaBD[]>("/recetas").then((r) => r.data),
      api.get<DetalleRecetaBD[]>("/detalle-receta").then((r) => r.data),
    ]);

    const pacientesMap = new Map(pacientes.map((p) => [p.id, p]));
    const usuariosMap = new Map(usuarios.map((u) => [u.id, u]));
    const medicamentosMap = new Map(medicamentos.map((m) => [m.id, m]));
    const especialidadesMap = new Map(especialidades.map((e) => [e.id, e.nombre]));

    const detallesPorReceta = new Map<number, DetalleRecetaBD[]>();
    for (const d of detallesBD) {
      if (d.Estado === "I") continue; // ignora detalles inactivos
      const arr = detallesPorReceta.get(d.IdReceta) ?? [];
      arr.push(d);
      detallesPorReceta.set(d.IdReceta, arr);
    }

    return recetasBD
      .filter((r) => r.Estado !== "Anulada")
      .map((r): Receta => {
        const paciente = pacientesMap.get(r.IdPaciente);
        const medico = usuariosMap.get(r.IdUsuario);
        const especialidadNombre = medico?.especialidadIds?.[0]
          ? especialidadesMap.get(medico.especialidadIds[0]) ?? "—"
          : "—";
        const items = (detallesPorReceta.get(r.IdReceta) ?? []).map((d) => ({
          medicamentoId: d.IdMedicamento,
          medicamento: medicamentosMap.get(d.IdMedicamento)?.nombre ?? "Medicamento no encontrado",
          cantidad: d.Cantidad,
          indicaciones: d.Indicaciones ?? "",
        }));

        return {
          id: r.IdReceta,
          paciente: paciente ? `${paciente.nombre} ${paciente.apellido1} ${paciente.apellido2}` : "—",
          cedulaPaciente: paciente?.cedula ?? "—",
          medico: medico ? `${medico.nombre} ${medico.apellido1}` : "—",
          especialidad: especialidadNombre,
          fecha: r.FechaEmision,
          items,
          estado: r.Estado,
        };
      });
  },
};