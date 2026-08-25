import { useEffect, useState } from "react";
import type { RegistroBitacora } from "../../types/clinica.types";
import { bitacoraService } from "../../services/bitacora.service";
import { useClinicaStore } from "../../types/clinicaStore";

const COLUMNAS_TABLA_BITACORA = "1.1fr 1.3fr 0.9fr 0.9fr 1.2fr 0.6fr";

const ROL_COLOR: Record<string, string> = {
  Administrador: "badge-soft-purple",
  Médico:        "badge-soft-emerald",
  Recepcionista: "badge-soft-blue",
  Farmacéutico:  "badge-soft-teal",
};

// Nombre "bonito" de cada tabla, para el encabezado del modal de detalle.
const TABLA_LABELS: Record<string, string> = {
  Usuario: "Usuario",
  Rol: "Rol",
  Especialidad: "Especialidad",
  UsuarioEspecialidad: "Especialidad asignada a médico",
  Paciente: "Paciente",
  Cita: "Cita",
  ExpedienteMedico: "Expediente médico",
  Consulta: "Consulta médica",
  Medicamento: "Medicamento",
  CategoriaMedicamento: "Categoría de medicamento",
  Receta: "Receta",
  DetalleReceta: "Detalle de receta",
  EntregaMedicamento: "Entrega de medicamento",
  Factura: "Factura",
  DetalleFactura: "Detalle de factura",
  Pago: "Pago",
  Login: "Inicio de sesión",
};

// Nombre "bonito" de cada columna de la base de datos.
const LABELS: Record<string, string> = {
  // Genéricos
  Estado: "Estado",
  // Usuario
  IdUsuario: "Usuario",
  Nombre: "Nombre",
  Apellido1: "Primer apellido",
  Apellido2: "Segundo apellido",
  Ident: "Cédula / identificación",
  Telefono: "Teléfono",
  Correo: "Correo electrónico",
  NombreUsuario: "Usuario de acceso",
  Contrasena: "Contraseña",
  IdRol: "Rol",
  FechaCreacion: "Fecha de creación",
  // Rol
  cita: "Atiende citas médicas",
  NombreRol: "Nombre del rol",
  // Especialidad
  IdEspecialidad: "Especialidad",
  NombreEspecialidad: "Nombre de la especialidad",
  // Paciente
  Cedula: "Cédula",
  FechaNacimiento: "Fecha de nacimiento",
  Sexo: "Sexo",
  Direccion: "Dirección",
  IdPaciente: "Paciente",
  // Cita
  IdCita: "Cita",
  FechaCita: "Fecha de la cita",
  HoraCita: "Hora de la cita",
  Motivo: "Motivo",
  // ExpedienteMedico
  IdExpediente: "Expediente",
  Observaciones: "Observaciones",
  // Consulta
  IdConsulta: "Consulta",
  Diagnostico: "Diagnóstico",
  Tratamiento: "Tratamiento",
  // Medicamento
  IdMedicamento: "Medicamento",
  NombreMedicamento: "Nombre del medicamento",
  Descripcion: "Descripción",
  IdCategoria: "Categoría",
  Presentacion: "Presentación",
  Ubicacion: "Ubicación",
  StockActual: "Stock actual",
  StockMinimo: "Stock mínimo",
  PrecioUnitario: "Precio unitario",
  // CategoriaMedicamento
  NombreCategoria: "Nombre de la categoría",
  Comentario: "Comentario",
  // Receta / DetalleReceta
  IdReceta: "Receta",
  IdDetalleReceta: "Detalle de receta",
  Cantidad: "Cantidad",
  Indicaciones: "Indicaciones",
  IncluirFactura: "Se cobra en esta factura",
  // EntregaMedicamento
  IdEntrega: "Entrega",
  // Factura / DetalleFactura
  IdFactura: "Factura",
  IdDetalleFactura: "Detalle de factura",
  MontoConsulta: "Monto de consulta",
  MontoReceta: "Monto de receta",
  Total: "Total",
  Concepto: "Concepto",
  Subtotal: "Subtotal",
  // Pago
  IdPago: "Pago",
  Monto: "Monto",
  MetodoPago: "Método de pago",
};

const CAMPOS_BOOLEANOS = new Set(["cita", "IncluirFactura"]);
const CAMPOS_DINERO = new Set(["PrecioUnitario", "MontoConsulta", "MontoReceta", "Total", "Monto", "Subtotal"]);
const CAMPOS_FECHA = new Set(["FechaNacimiento", "FechaCita", "FechaCreacion", "Fecha"]);
// Estos campos nunca se muestran en la bitácora tal cual (por seguridad o
// porque ya se muestran de otra forma más amigable en la fila principal).
const CAMPOS_OCULTOS = new Set<string>([]);

function etiquetaCampo(campo: string): string {
  return LABELS[campo] ?? campo.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

interface Lookups {
  categorias: Record<number, string>;
  usuarios: Record<number, string>;
  pacientes: Record<number, string>;
  especialidades: Record<number, string>;
  roles: Record<number, string>;
  medicamentos: Record<number, string>;
}

function formatearValor(campo: string, valor: any, lookups: Lookups): string {
  if (valor === null || valor === undefined || valor === "") return "—";

  if (campo === "Contrasena") return "•••••••••";

  if (campo === "IdCategoria" && lookups.categorias[valor]) return lookups.categorias[valor];
  if (campo === "IdUsuario" && lookups.usuarios[valor]) return lookups.usuarios[valor];
  if (campo === "IdPaciente" && lookups.pacientes[valor]) return lookups.pacientes[valor];
  if (campo === "IdEspecialidad" && lookups.especialidades[valor]) return lookups.especialidades[valor];
  if (campo === "IdRol" && lookups.roles[valor]) return lookups.roles[valor];
  if (campo === "IdMedicamento" && lookups.medicamentos[valor]) return lookups.medicamentos[valor];

  if (CAMPOS_BOOLEANOS.has(campo)) return valor === true || valor === 1 ? "Sí" : "No";

  if (campo === "Estado" && (valor === "A" || valor === "I")) return valor === "A" ? "Activo" : "Inactivo";

  if (CAMPOS_DINERO.has(campo)) {
    const n = Number(valor);
    return Number.isFinite(n) ? `₡${n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(valor);
  }

  if (CAMPOS_FECHA.has(campo)) {
    const d = new Date(valor);
    if (!Number.isNaN(d.getTime())) {
      // Si trae hora además de fecha, se muestra completa; si no, solo la fecha.
      const soloFecha = typeof valor === "string" && valor.length <= 10;
      return soloFecha ? d.toLocaleDateString("es-CR") : d.toLocaleString("es-CR");
    }
  }

  return String(valor);
}

// El backend guarda "inserted"/"deleted" con FOR JSON AUTO (sin
// WITHOUT_ARRAY_WRAPPER), así que llegan como un arreglo de un elemento:
// [{...}]. Esta función normaliza cualquiera de los dos formatos.
function normalizarObjeto(valor: any): any {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed[0] ?? null : parsed;
    } catch {
      return null;
    }
  }
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor;
}

interface FilaDetalle {
  campo: string;
  label: string;
  valor?: string;
  antes?: string;
  despues?: string;
  esCambio: boolean;
}

// Convierte el JSON crudo guardado en la columna Registro en una lista de
// filas "Campo: valor" (para INSERT/DELETE) o "Campo: antes → después"
// (para UPDATE, mostrando solo lo que realmente cambió).
function construirFilas(registroCrudo: string, lookups: Lookups): FilaDetalle[] | null {
  let obj: any;
  try {
    obj = JSON.parse(registroCrudo);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;

  // Caso UPDATE: { Antes: "...", Despues: "..." }
  if ("Antes" in obj || "Despues" in obj) {
    const antes = normalizarObjeto(obj.Antes) ?? {};
    const despues = normalizarObjeto(obj.Despues) ?? {};
    const claves = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)])).filter(
      (c) => !CAMPOS_OCULTOS.has(c)
    );

    // Se muestran TODOS los campos (no solo los que cambiaron), con su
    // valor antes y después. Los que sí cambiaron se resaltan.
    return claves.map((campo) => {
      const vAntes = formatearValor(campo, antes[campo], lookups);
      const vDespues = formatearValor(campo, despues[campo], lookups);
      return {
        campo,
        label: etiquetaCampo(campo),
        antes: vAntes,
        despues: vDespues,
        esCambio: vAntes !== vDespues,
      };
    });
  }

  // Caso INSERT/DELETE: el objeto plano de la fila (o Login: {Usuario, Detalle})
  const fila = normalizarObjeto(obj) ?? obj;
  return Object.keys(fila)
    .filter((c) => !CAMPOS_OCULTOS.has(c))
    .map((campo) => ({
      campo,
      label: etiquetaCampo(campo),
      valor: formatearValor(campo, fila[campo], lookups),
      esCambio: false,
    }));
}

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-CR");
}

function ModalDetalle({
  registro,
  lookups,
  onCerrar,
}: {
  registro: RegistroBitacora;
  lookups: Lookups;
  onCerrar: () => void;
}) {
  const esLogin = registro.tabla === "Login";
  const filas = !esLogin ? construirFilas(registro.registro, lookups) : null;

  // Para el login, mostramos el detalle en texto plano y amigable,
  // extrayendo el usuario ingresado y el mensaje ya redactado.
  let detalleLogin: { usuarioIngresado?: string; detalle?: string } | null = null;
  if (esLogin) {
    const obj = normalizarObjeto(registro.registro) ?? (() => {
      try {
        return JSON.parse(registro.registro);
      } catch {
        return null;
      }
    })();
    if (obj) {
      detalleLogin = { usuarioIngresado: obj.Usuario, detalle: obj.Detalle };
    }
  }

  return (
     <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow w-100 d-flex flex-column"
        style={{ maxWidth: 640, maxHeight: "85vh" }}
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {TABLA_LABELS[registro.tabla] ?? registro.tabla} · {registro.accion}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>
        <div className="p-4 overflow-auto">
          <p className="fs-12 text-secondary mb-3">
            {formatearFecha(registro.fecha)} · Usuario: {registro.usuarioSql}
            {registro.rol ? ` · Rol: ${registro.rol}` : ""}
          </p>

          {esLogin ? (
            <div className="bg-soft border rounded p-3 fs-6">
              {detalleLogin?.usuarioIngresado && (
                <p className="mb-2">
                  <strong>Usuario ingresado:</strong> {detalleLogin.usuarioIngresado}
                </p>
              )}
              {detalleLogin?.detalle && (
                <p className="mb-0">
                  <strong>Detalle:</strong> {detalleLogin.detalle}
                </p>
              )}
              {!detalleLogin && <p className="text-secondary mb-0">No hay detalle disponible.</p>}
            </div>
          ) : filas === null ? (
            <p className="text-secondary fs-6 mb-0">No fue posible interpretar el detalle de este registro.</p>
          ) : filas.length === 0 ? (
            <p className="text-secondary fs-6 mb-0">
              {registro.accion === "UPDATE"
                ? "No se detectaron cambios visibles en los campos de este registro."
                : "Este registro no tiene datos adicionales."}
            </p>
          ) : (
            <div className="bg-soft border rounded overflow-hidden">
                         {filas.map((f, i) => (
                <div
                  key={f.campo}
                  className={`px-3 py-2 fs-6 ${i !== filas.length - 1 ? "border-bottom" : ""}`}
                >
                  <p className="fw-medium text-dark mb-1">{f.label}</p>
                  {f.esCambio ? (
                    <p className="mb-0">
                      <span className="text-secondary">{f.antes}</span>
                      {" → "}
                      <span className="text-primary fw-medium">{f.despues}</span>
                    </p>
                  ) : (
                    <p className="text-secondary mb-0">{f.valor ?? f.antes ?? f.despues}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-top d-flex justify-content-end flex-shrink-0">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function GestionBitacora() {
  const snap = useClinicaStore();
  const [registros, setRegistros] = useState<RegistroBitacora[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroTabla, setFiltroTabla] = useState<string>("Todas");
  const [detalle, setDetalle] = useState<RegistroBitacora | null>(null);

  const lookups: Lookups = {
    categorias: Object.fromEntries(snap.categoriasMedicamento.map((c) => [c.id, c.nombre])),
    usuarios: Object.fromEntries(snap.usuarios.map((u) => [u.id, `${u.nombre} ${u.apellido1}`.trim()])),
    pacientes: Object.fromEntries(snap.pacientes.map((p) => [p.id, `${p.nombre} ${p.apellido1} ${p.apellido2 ?? ""}`.trim()])),
    especialidades: Object.fromEntries(snap.especialidades.map((e) => [e.id, e.nombre])),
    roles: Object.fromEntries(snap.roles.map((r) => [r.IdRol, r.NombreRol])),
    medicamentos: Object.fromEntries(snap.medicamentos.map((m) => [m.id, m.nombre])),
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await bitacoraService.listar();
      setRegistros(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const tablas = Array.from(new Set(registros.map((r) => r.tabla))).sort();

  const registrosFiltrados = registros.filter((r) => {
    const texto = busqueda.trim().toLowerCase();
    const coincideTexto =
      texto === "" ||
      r.tabla.toLowerCase().includes(texto) ||
      r.accion.toLowerCase().includes(texto) ||
      r.usuarioSql.toLowerCase().includes(texto) ||
      (r.rol ?? "").toLowerCase().includes(texto);
    const coincideTabla = filtroTabla === "Todas" || r.tabla === filtroTabla;
    return coincideTexto && coincideTabla;
  });

  const badgeAccion = (accion: string) => {
    if (accion === "INSERT" || accion === "EXITOSO") return "badge-soft-green";
    if (accion === "UPDATE") return "badge-soft-amber";
    if (accion === "DELETE" || accion === "FALLIDO") return "badge-soft-red";
    return "badge-soft-gray";
  };

  const etiquetaAccion = (accion: string) => {
    if (accion === "EXITOSO") return "Login exitoso";
    if (accion === "FALLIDO") return "Login fallido";
    return accion;
  };

  return (
    <>
      {detalle && <ModalDetalle registro={detalle} lookups={lookups} onCerrar={() => setDetalle(null)} />}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Bitácora del sistema</h2>
          <button onClick={cargar} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Actualizar
          </button>
        </div>

        <div className="p-4">
          {cargando ? (
            <p className="fs-6 text-secondary text-center py-5 mb-0">Cargando bitácora…</p>
          ) : (
            <>
              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
                  <i className="bi bi-search text-secondary fs-6" aria-hidden="true" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por tabla, usuario, rol o acción…"
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                  />
                </div>
                <select
                  value={filtroTabla}
                  onChange={(e) => setFiltroTabla(e.target.value)}
                  className="form-select form-select-sm bg-soft"
                  style={{ maxWidth: 220 }}
                >
                  <option value="Todas">Todas las tablas</option>
                  {tablas.map((t) => (
                    <option key={t} value={t}>{TABLA_LABELS[t] ?? t}</option>
                  ))}
                </select>
              </div>

              <div className="border rounded overflow-hidden">
                <div
                  className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
                  style={{ display: "grid", gridTemplateColumns: COLUMNAS_TABLA_BITACORA, letterSpacing: ".03em" }}
                >
                  <span>Tabla</span><span>Usuario</span><span>Rol</span><span>Acción</span><span>Fecha</span><span className="text-center">Detalle</span>
                </div>

                {registrosFiltrados.length === 0 && (
                  <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron registros.</p>
                )}

                {registrosFiltrados.map((r) => (
                  <div
                    key={r.id}
                    className="px-3 py-3 border-bottom align-items-center fs-6 hover-row d-grid"
                    style={{ gridTemplateColumns: COLUMNAS_TABLA_BITACORA }}
                  >
                    <p className="fw-medium text-dark mb-0">{TABLA_LABELS[r.tabla] ?? r.tabla}</p>
                    <p className="text-secondary fs-12 mb-0">{r.usuarioSql}</p>
                    <div>
                      {r.rol ? (
                        <span className={`badge-soft ${ROL_COLOR[r.rol] ?? "badge-soft-gray"}`}>{r.rol}</span>
                      ) : (
                        <span className="text-secondary fs-12">—</span>
                      )}
                    </div>
                    <div>
                      <span className={`badge-soft ${badgeAccion(r.accion)}`}>{etiquetaAccion(r.accion)}</span>
                    </div>
                    <p className="text-secondary fs-12 mb-0">{formatearFecha(r.fecha)}</p>
                    <div className="d-flex align-items-center justify-content-center">
                      <button
                        onClick={() => setDetalle(r)}
                        className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye-fill" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}