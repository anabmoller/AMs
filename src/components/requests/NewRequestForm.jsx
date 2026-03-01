import { useState, useEffect, useMemo } from "react";
import {
  PRIORITY_LEVELS, INVENTORY_ITEMS,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getEstablishments, getSectors, getProductTypes, getSuppliers } from "../../constants/parameters";
import { calculateApprovalSteps } from "../../constants/approvalConfig";
import { findBudgetForPR, wouldExceedBudget, formatGuaranies } from "../../constants/budgets";
import { getUsers } from "../../constants/users";
import SummaryRow from "../common/SummaryRow";
import InventoryModal from "./InventoryModal";

const UNITS = ["Unidad", "Litro", "Kg", "Dosis", "Bolsa", "Balde", "Caja", "Rollo", "Metro", "Otro"];

// Establishments that are NOT farms (no auto-assign)
const OFICINA_ESTABLISHMENTS = ["Oficina"];
const DEFAULT_FARM_ASSIGNEE = "Laura Rivas";

export default function NewRequestForm({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const { requests } = useApp();
  const [step, setStep] = useState(1);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [form, setForm] = useState({
    name: "",
    requester: currentUser?.name || "",
    establishment: currentUser?.establishment !== "General" ? currentUser?.establishment || "" : "",
    sector: "",
    type: "",
    urgency: "media",
    quantity: 1,
    unit: "Unidad",
    totalAmount: 0,
    reason: "",
    purpose: "",
    equipment: "",
    assignee: "",
    fromInventory: false,
    inventoryItem: null,
    suggestedSupplier: "",
    notes: "",
  });
  const [showInventory, setShowInventory] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === "establishment" && val) {
        next.assignee = OFICINA_ESTABLISHMENTS.includes(val)
          ? ""
          : DEFAULT_FARM_ASSIGNEE;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const selectInventoryItem = (item) => {
    setForm(prev => ({
      ...prev,
      name: item.name,
      type: item.type,
      fromInventory: true,
      inventoryItem: item,
    }));
    setErrors({});
    setShowInventory(false);
  };

  // Price history: find last purchase price for the selected product
  const priceHistory = useMemo(() => {
    if (!form.name || !requests?.length) return null;
    const needle = form.name.toLowerCase().trim();
    for (const req of requests) {
      if (!req.items?.length) continue;
      for (const item of req.items) {
        const itemName = (item.name || item.nombre || "").toLowerCase().trim();
        if (itemName === needle && (item.unitPrice || item.precioUnitario)) {
          return {
            unitPrice: item.unitPrice || item.precioUnitario,
            quantity: item.quantity || item.cantidad || 1,
            totalPrice: item.totalPrice || (item.unitPrice || item.precioUnitario) * (item.quantity || item.cantidad || 1),
            date: req.createdAt || req.date,
            establishment: req.establishment,
          };
        }
      }
    }
    return null;
  }, [form.name, requests]);

  // Calculate preview approval info
  const approvalPreview = useMemo(() => {
    if (!form.establishment || !form.totalAmount) return null;
    try {
      const users = getUsers();
      const steps = calculateApprovalSteps({
        establishment: form.establishment,
        totalAmount: form.totalAmount || 0,
        urgency: (form.urgency || "media").toLowerCase(),
        sector: form.sector || "",
        company: null,
        budgetExceeded: false,
      }, users);
      return steps;
    } catch { return null; }
  }, [form.establishment, form.totalAmount, form.urgency, form.sector]);

  // Budget check preview
  const budgetInfo = useMemo(() => {
    if (!form.establishment || !form.sector) return null;
    const budget = findBudgetForPR(form.establishment, form.sector);
    if (!budget) return null;
    const exceeds = form.totalAmount > 0 ? wouldExceedBudget(budget, form.totalAmount) : false;
    return { budget, exceeds };
  }, [form.establishment, form.sector, form.totalAmount]);

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Requerido";
      if (!form.requester.trim()) e.requester = "Requerido";
      if (!form.establishment) e.establishment = "Requerido";
      if (!form.sector) e.sector = "Requerido";
    }
    if (step === 2) {
      if (!form.quantity || form.quantity <= 0) e.quantity = "Debe ser > 0";
      if (!form.reason.trim()) e.reason = "Requerido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      if (step < 3) setStep(s => s + 1);
      else {
        const formToSubmit = { ...form };
        if (form.name) {
          const unitPrice = form.totalAmount && form.quantity
            ? Math.round(form.totalAmount / form.quantity)
            : 0;
          formToSubmit.items = [{
            name: form.name,
            code: form.inventoryItem?.code || "",
            quantity: form.quantity || 1,
            unit: form.unit || "Unidad",
            unitPrice,
            totalPrice: form.totalAmount || 0,
            notes: "",
          }];
        }
        onSubmit(formToSubmit);
      }
    }
  };

  const stepTitles = [
    { title: "¿Qué necesitas?", sub: "Selecciona del catálogo o crea un producto nuevo" },
    { title: "Detalles", sub: "Cantidad, urgencia y justificación de la compra" },
    { title: "Revisión y Envío", sub: "Verifica los datos antes de crear la solicitud" },
  ];

  const FieldError = ({ field }) => errors[field]
    ? <div className="text-[11px] text-red-400 mt-0.5 font-medium">{errors[field]}</div>
    : null;

  return (
    <div className="pb-10 animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="bg-transparent border-none cursor-pointer text-sm text-blue-400 font-medium"
        >
          ← Cancelar
        </button>
        <span className="text-xs text-slate-400 font-medium">
          Paso {step} de 3
        </span>
      </div>

      <div className="px-5">
        <h2 className="text-[22px] font-semibold text-white mb-1 mt-0">
          {stepTitles[step - 1].title}
        </h2>
        <div className="text-[13px] text-slate-400 mb-5">
          {stepTitles[step - 1].sub}
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="flex-1 h-1 rounded-sm transition-colors duration-300"
              style={{
                background: s <= step
                  ? s < step ? '#22c55e' : '#10b981'
                  : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>

        {/* ============ Step 1: Product Selection ============ */}
        {step === 1 && (
          <div className="flex flex-col gap-3.5">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Producto *</label>
              <div
                onClick={() => setShowInventory(true)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center gap-2 cursor-pointer ${
                  form.fromInventory ? 'bg-green-500/[0.04] border-green-500/25' : 'bg-white/[0.03]'
                } ${errors.name ? 'border-red-500' : form.fromInventory ? '' : 'border-white/[0.1]'}`}
              >
                <span className="text-base">📦</span>
                <span className={`flex-1 text-sm ${form.name ? 'text-white' : 'text-slate-400'}`}>
                  {form.name || "Buscar en catalogo o crear nuevo..."}
                </span>
                {form.inventoryItem && (
                  <span className="text-[10px] bg-green-500/[0.08] text-green-400 px-2 py-0.5 rounded font-semibold font-mono">
                    {form.inventoryItem.code}
                  </span>
                )}
                {form.fromInventory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      update("name", "");
                      update("type", "");
                      update("fromInventory", false);
                      update("inventoryItem", null);
                    }}
                    className="bg-white/[0.06] border-none cursor-pointer w-[22px] h-[22px] rounded text-[11px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>
              <FieldError field="name" />
            </div>

            {showInventory && (
              <InventoryModal
                onSelect={selectInventoryItem}
                onClose={() => setShowInventory(false)}
                onNewProduct={() => {
                  setShowInventory(false);
                  update("fromInventory", false);
                  update("inventoryItem", null);
                }}
              />
            )}

            {!form.fromInventory && !form.inventoryItem && form.name === "" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre del producto (manual)</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.name ? 'border-red-500' : 'border-white/[0.1]'}`}
                />
                <FieldError field="name" />
              </div>
            )}

            {!form.fromInventory && form.name && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre del producto</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                />
              </div>
            )}

            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Solicitante *</label>
                <input
                  value={form.requester}
                  readOnly
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.02] text-sm text-slate-400 outline-none cursor-default ${errors.requester ? 'border-red-500' : 'border-white/[0.1]'}`}
                />
                <FieldError field="requester" />
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Establecimiento *</label>
                <select
                  value={form.establishment}
                  onChange={e => update("establishment", e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.establishment ? 'border-red-500' : 'border-white/[0.1]'}`}
                >
                  <option value="">Seleccionar...</option>
                  {getEstablishments().filter(e => e.active).map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                </select>
                <FieldError field="establishment" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Sector *</label>
                <select
                  value={form.sector}
                  onChange={e => update("sector", e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.sector ? 'border-red-500' : 'border-white/[0.1]'}`}
                >
                  <option value="">Seleccionar...</option>
                  {getSectors().filter(s => s.active).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <FieldError field="sector" />
              </div>
            </div>

            {!form.fromInventory && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Tipo de Producto</label>
                <select
                  value={form.type}
                  onChange={e => update("type", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                >
                  <option value="">Seleccionar...</option>
                  {getProductTypes().filter(t => t.active).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            )}

            {form.fromInventory && form.inventoryItem && (
              <div className="bg-green-500/[0.04] rounded-xl px-3.5 py-2.5 border border-green-500/[0.12]">
                <div className="text-[11px] font-semibold text-green-400 mb-1">
                  ✓ Producto del catalogo
                </div>
                <div className="text-xs text-slate-400">
                  {form.inventoryItem.code} · {form.inventoryItem.group} · {form.inventoryItem.type}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ Step 2: Details ============ */}
        {step === 2 && (
          <div className="flex flex-col gap-3.5">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Cantidad *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => update("quantity", parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.quantity ? 'border-red-500' : 'border-white/[0.1]'}`}
                  min={1}
                />
                <FieldError field="quantity" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Unidad</label>
                <select
                  value={form.unit}
                  onChange={e => update("unit", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Monto Estimado (₲)</label>
              <input
                type="number"
                value={form.totalAmount || ""}
                onChange={e => update("totalAmount", parseInt(e.target.value) || 0)}
                placeholder="Ej: 5000000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                min={0}
              />
              {form.totalAmount > 0 && (
                <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                  {formatGuaranies(form.totalAmount)}
                </div>
              )}
              {/* Price history suggestion */}
              {priceHistory && !form.totalAmount && (
                <button
                  type="button"
                  onClick={() => update("totalAmount", Math.round(priceHistory.unitPrice * (form.quantity || 1)))}
                  className="mt-1.5 p-2.5 rounded-lg bg-blue-500/[0.06] border border-blue-500/[0.15] cursor-pointer w-full text-left"
                >
                  <div className="text-[11px] font-semibold text-blue-400">
                    💡 Precio historico disponible
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ultima compra: {formatGuaranies(priceHistory.unitPrice)}/unidad
                    {priceHistory.date && ` — ${new Date(priceHistory.date).toLocaleDateString("es-PY")}`}
                  </div>
                  <div className="text-[10px] text-blue-400 mt-0.5 font-medium">
                    Clic para usar: {formatGuaranies(priceHistory.unitPrice * (form.quantity || 1))}
                  </div>
                </button>
              )}
            </div>

            {/* Budget indicator */}
            {budgetInfo && form.totalAmount > 0 && (
              <div className={`rounded-lg px-3 py-2 border ${
                budgetInfo.exceeds
                  ? 'bg-red-500/[0.05] border-red-500/[0.12]'
                  : 'bg-green-500/[0.04] border-green-500/[0.12]'
              }`}>
                <div className={`text-[11px] font-semibold ${budgetInfo.exceeds ? 'text-red-400' : 'text-green-400'}`}>
                  {budgetInfo.exceeds ? "⚠ Excede presupuesto" : "✓ Dentro del presupuesto"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Presupuesto: {formatGuaranies(budgetInfo.budget.planned)} ({form.establishment} / {form.sector})
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Prioridad</label>
              <div className="flex gap-2">
                {PRIORITY_LEVELS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => update("urgency", u.value)}
                    className="flex-1 px-1.5 py-3 rounded-lg text-center transition-all duration-150 cursor-pointer"
                    style={{
                      border: form.urgency === u.value
                        ? `2px solid ${u.color}`
                        : '1px solid rgba(255,255,255,0.06)',
                      background: form.urgency === u.value ? (u.colorLight || u.color + "10") : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="text-base">{u.icon}</div>
                    <div
                      className="text-[11px] font-semibold mt-1"
                      style={{ color: form.urgency === u.value ? u.color : '#94a3b8' }}
                    >
                      {u.label}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {u.days ? `${u.days}d` : `${u.hours}h`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">¿Por que necesitas este producto? *</label>
              <textarea
                value={form.reason}
                onChange={e => update("reason", e.target.value)}
                placeholder="Justificacion de la compra..."
                rows={3}
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y ${errors.reason ? 'border-red-500' : 'border-white/[0.1]'}`}
              />
              <FieldError field="reason" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">¿Para que sera utilizado?</label>
              <textarea
                value={form.purpose}
                onChange={e => update("purpose", e.target.value)}
                placeholder="Descripción del uso previsto..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y"
              />
            </div>

            {(form.type === "Repuesto" || form.type === "Equipamento" || form.type === "Maquinario") && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Equipo/Maquinaria relacionada</label>
                <input
                  value={form.equipment}
                  onChange={e => update("equipment", e.target.value)}
                  placeholder="Ej: Valtra BH 194, John Deere cod 26"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Proveedor Sugerido</label>
              {!isCustomSupplier ? (
                <select
                  value={form.suggestedSupplier}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      setIsCustomSupplier(true);
                      update("suggestedSupplier", "");
                    } else {
                      update("suggestedSupplier", e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                >
                  <option value="">Seleccionar proveedor (opcional)...</option>
                  {(() => {
                    const suppliers = getSuppliers();
                    const productType = (form.type || "").toLowerCase();
                    const sorted = [...suppliers].sort((a, b) => {
                      const aCat = (a.category || "").toLowerCase();
                      const bCat = (b.category || "").toLowerCase();
                      const aMatch = productType && aCat.includes(productType) ? 0 : 1;
                      const bMatch = productType && bCat.includes(productType) ? 0 : 1;
                      if (aMatch !== bMatch) return aMatch - bMatch;
                      return (a.name || "").localeCompare(b.name || "");
                    });
                    const matching = sorted.filter(s => productType && (s.category || "").toLowerCase().includes(productType));
                    const rest = sorted.filter(s => !productType || !(s.category || "").toLowerCase().includes(productType));
                    return (
                      <>
                        {matching.map(s => (
                          <option key={s.id} value={s.name}>{s.name} — {s.category}</option>
                        ))}
                        {matching.length > 0 && rest.length > 0 && (
                          <option disabled>── Otros proveedores ──</option>
                        )}
                        {rest.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </>
                    );
                  })()}
                  <option value="__custom__">✏ Otro (escribir manualmente)</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    value={form.suggestedSupplier}
                    onChange={e => update("suggestedSupplier", e.target.value)}
                    placeholder="Nombre del proveedor..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 flex-1"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSupplier(false);
                      update("suggestedSupplier", "");
                    }}
                    className="bg-white/[0.06] border-none cursor-pointer rounded-lg px-2.5 text-[11px] text-slate-400"
                  >
                    ✕ Lista
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Notas adicionales</label>
              <textarea
                value={form.notes}
                onChange={e => update("notes", e.target.value)}
                placeholder="Observaciones, especificaciones tecnicas..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y"
              />
            </div>
          </div>
        )}

        {/* ============ Step 3: Review & Submit ============ */}
        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            {/* Approval preview */}
            <div className="bg-emerald-500/[0.04] rounded-xl px-3.5 py-3 border border-emerald-500/[0.08]">
              <div className="text-xs font-semibold text-emerald-400 mb-1.5">
                🔄 Flujo de Autorización y Aprobación
              </div>
              {approvalPreview && approvalPreview.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {approvalPreview.map((s, i) => (
                    <div key={i} className="text-[11px] text-white flex items-center gap-1.5">
                      <span className="w-[18px] h-[18px] rounded-full bg-emerald-500/[0.08] text-emerald-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium">{s.label}:</span>
                      <span className="text-slate-400">{s.approverName || "Automatico"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Los aprobadores se asignaran automaticamente segun establecimiento, monto y sector.
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.06]">
              <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wide">
                Resumen de la solicitud
              </div>
              <SummaryRow label="Producto" value={form.name} />
              {form.inventoryItem && <SummaryRow label="Código" value={form.inventoryItem.code} />}
              <SummaryRow label="Solicitante" value={form.requester} />
              <SummaryRow label="Establecimiento" value={form.establishment} />
              <SummaryRow label="Sector" value={form.sector} />
              <SummaryRow label="Tipo" value={form.type || "—"} />
              <SummaryRow label="Cantidad" value={`${form.quantity} ${form.unit}`} />
              <SummaryRow
                label="Monto Est."
                value={form.totalAmount > 0 ? formatGuaranies(form.totalAmount) : "—"}
              />
              <SummaryRow label="Urgencia" value={form.urgency} />
              <SummaryRow label="Motivo" value={form.reason} />
              {form.purpose && <SummaryRow label="Uso" value={form.purpose} />}
              {form.equipment && <SummaryRow label="Equipo" value={form.equipment} />}
              {form.suggestedSupplier && <SummaryRow label="Proveedor" value={form.suggestedSupplier} />}
            </div>

            {/* Budget warning */}
            {budgetInfo?.exceeds && (
              <div className="bg-amber-500/[0.06] rounded-lg px-3 py-2.5 border border-amber-500/[0.19]">
                <div className="text-[11px] font-semibold text-amber-400">
                  ⚠ Esta solicitud excede el presupuesto asignado
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Se requerira aprobacion adicional del Director
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2.5 mt-6 pb-5">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm font-semibold cursor-pointer"
            >
              ← Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className="py-3.5 rounded-xl border-none text-white text-sm font-semibold cursor-pointer shadow-md"
            style={{
              flex: step > 1 ? 1 : undefined,
              width: step === 1 ? "100%" : undefined,
              background: step === 3 ? '#6366f1' : '#10b981',
            }}
          >
            {step === 3 ? "Crear Solicitud ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
