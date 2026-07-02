import React, { useState } from "react";
import type { CategoriaMedicamento, Medicamento } from "../../types/clinica.types";
import { useClinicaStore, clinicaStore } from "../../types/clinicaStore";

const CATEGORIAS: CategoriaMedicamento[] = [
  "Analgésico",
  "Antibiótico",
  "Antiinflamatorio",
  "Antialérgico",
  "Antihipertensivo",
  "Vitaminas",
  "Otro",
];

const COLUMNAS_TABLA_INVENTARIO = "1.8fr 1.1fr 1fr 0.9fr 0.9fr 0.9fr 0.7fr";

type FormMedicamento = Omit<Medicamento, "id"> & { id?: number };

const FORM_VACIO: FormMedicamento = {
  nombre: "",
  presentacion: "",
  unidad: "",
  laboratorio: "",
  categoria: "Analgésico",
  stock: 0,
  stockMinimo: 0,
  precio: 0,
};

interface ModalMedicamentoProps {
  medicamento?: Medicamento;
  onGuardar: (form: FormMedicamento) => void;
  onCerrar: () => void;
}

function ModalMedicamento({ medicamento, onGuardar, onCerrar }: ModalMedicamentoProps) {
  const esNuevo = !medicamento?.id;
  const [form, setForm] = useState<FormMedicamento>(
    medicamento ? { ...medicamento } : FORM_VACIO
  );

  const handleChange = <K extends keyof FormMedicamento>(campo: K, valor: FormMedicamento[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.presentacion.trim() || !form.laboratorio.trim()) {
      alert("Nombre, presentación y laboratorio son obligatorios.");
      return;
    }
    if (form.stock < 0 || form.stockMinimo < 0 || form.precio < 0) {
      alert("Los valores numéricos no pueden ser negativos.");
      return;
    }
    onGuardar(form);
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center p-3">
      <div className="bg-white rounded-4 shadow w-100" style={{ maxWidth: 480 }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="fs-6 fw-medium text-dark mb-0">
            {esNuevo ? "Añadir medicamento" : "Modificar medicamento"}
          </h3>
          <button onClick={onCerrar} className="btn btn-link text-secondary fs-5 lh-1 text-decoration-none p-0">✕</button>
        </div>

        <div className="p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-12 text-secondary mb-1">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Acetaminofén"
              className="form-control form-control-sm"
            />
          </div>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Presentación</label>
              <input
                value={form.presentacion}
                onChange={(e) => handleChange("presentacion", e.target.value)}
                placeholder="Tableta 500 mg"
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Unidad de venta</label>
              <input
                value={form.unidad}
                onChange={(e) => handleChange("unidad", e.target.value)}
                placeholder="Caja x 20"
                className="form-control form-control-sm"
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Laboratorio</label>
              <input
                value={form.laboratorio}
                onChange={(e) => handleChange("laboratorio", e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fs-12 text-secondary mb-1">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value as CategoriaMedicamento)}
                className="form-select form-select-sm"
              >
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Stock actual</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => handleChange("stock", Number(e.target.value))}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Stock mínimo</label>
              <input
                type="number"
                value={form.stockMinimo}
                onChange={(e) => handleChange("stockMinimo", Number(e.target.value))}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fs-12 text-secondary mb-1">Precio (₡)</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => handleChange("precio", Number(e.target.value))}
                className="form-control form-control-sm"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button onClick={onCerrar} className="btn btn-outline-secondary btn-sm">Cancelar</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm">
            {esNuevo ? "Añadir medicamento" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionInventario() {
  const { medicamentos } = useClinicaStore();

  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [modalMedicamento, setModalMedicamento] = useState<Medicamento | null | undefined>(undefined);

  const medicamentosFiltrados = medicamentos.filter((m) => {
    const coincideCategoria = filtroCategoria === "Todas" || m.categoria === filtroCategoria;
    const texto = busqueda.trim().toLowerCase();
    const coincideBusqueda = texto === "" || m.nombre.toLowerCase().includes(texto) || m.laboratorio.toLowerCase().includes(texto);
    return coincideCategoria && coincideBusqueda;
  });

  const stats = {
    total: medicamentos.length,
    bajoStock: medicamentos.filter((m) => m.stock <= m.stockMinimo && m.stock > 0).length,
    agotados: medicamentos.filter((m) => m.stock === 0).length,
  };

  const estadoStock = (m: Medicamento) => {
    if (m.stock === 0) return { label: "Agotado", clase: "badge-soft-red" };
    if (m.stock <= m.stockMinimo) return { label: "Stock bajo", clase: "badge-soft-amber" };
    return { label: "Disponible", clase: "badge-soft-green" };
  };

  const guardarMedicamento = (form: FormMedicamento) => {
    if (form.id) {
      clinicaStore.actualizarMedicamento(form as Medicamento);
    } else {
      clinicaStore.crearMedicamento(form);
    }
    setModalMedicamento(undefined);
  };

  return (
    <>
      {modalMedicamento !== undefined && (
        <ModalMedicamento
          medicamento={modalMedicamento ?? undefined}
          onGuardar={guardarMedicamento}
          onCerrar={() => setModalMedicamento(undefined)}
        />
      )}

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className="px-4 py-3 border-bottom bg-soft d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h2 className="fs-6 fw-bold text-dark text-start mb-0">Gestión de inventario</h2>
          <button onClick={() => setModalMedicamento(null)} className="btn btn-primary btn-sm">
            + Añadir medicamento
          </button>
        </div>

        <div className="p-4">
          <div className="row row-cols-3 g-3 mb-4">
            <div className="col"><StatCard label="Medicamentos" value={stats.total} /></div>
            <div className="col"><StatCard label="Stock bajo" value={stats.bajoStock} color="text-warning" /></div>
            <div className="col"><StatCard label="Agotados" value={stats.agotados} color="text-danger" /></div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className="flex-fill d-flex align-items-center gap-2 bg-soft border rounded px-3 py-2">
              <span className="text-secondary fs-6"></span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o laboratorio…"
                className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="form-select form-select-sm bg-soft"
              style={{ maxWidth: 220 }}
            >
              <option value="Todas">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="border rounded overflow-hidden">
            <div
              className="d-none d-md-grid px-3 py-2 bg-soft fs-11 text-uppercase text-secondary fw-medium border-bottom"
              style={{ display: "grid", gridTemplateColumns: COLUMNAS_TABLA_INVENTARIO, letterSpacing: ".03em" }}
            >
              <span>Medicamento</span><span>Laboratorio</span><span>Categoría</span><span>Stock</span><span>Precio</span><span>Estado</span><span className="text-center">Acciones</span>
            </div>

            {medicamentosFiltrados.length === 0 && (
              <p className="px-3 py-5 text-center fs-6 text-secondary mb-0">No se encontraron medicamentos.</p>
            )}

            {medicamentosFiltrados.map((m) => {
              const estado = estadoStock(m);
              return (
                <div
                  key={m.id}
                  className="px-3 py-3 border-bottom align-items-center fs-6 hover-row d-grid"
                  style={{ gridTemplateColumns: COLUMNAS_TABLA_INVENTARIO }}
                >
                  <div>
                    <p className="fw-medium text-dark mb-0">{m.nombre}</p>
                    <p className="fs-11 text-secondary mb-0">{m.presentacion} · {m.unidad}</p>
                  </div>
                  <p className="text-secondary fs-12 mb-0">{m.laboratorio}</p>
                  <div>
                    <span className="badge-soft badge-soft-gray">{m.categoria}</span>
                  </div>
                  <p className="fs-12 mb-0">{m.stock} <span className="text-secondary">/ min {m.stockMinimo}</span></p>
                  <p className="fs-12 mb-0">₡{m.precio.toLocaleString("es-CR")}</p>
                  <div>
                    <span className={`badge-soft ${estado.clase}`}>{estado.label}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-center">
                    <button
                      onClick={() => setModalMedicamento(m)}
                      className="btn btn-outline-secondary btn-icon-sm bg-white text-secondary"
                      title="Modificar"
                    >
                      ✎
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color = "text-dark" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-soft border rounded px-3 py-3">
      <p className={`fs-4 fw-medium mb-0 ${color}`}>{value}</p>
      <p className="fs-11 text-secondary mt-1 mb-0">{label}</p>
    </div>
  );
}