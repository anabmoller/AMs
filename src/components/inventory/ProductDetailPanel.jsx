import { useState, useMemo, useEffect } from "react";
import { FileText, Building2, BarChart3, ClipboardList, Star, Calendar } from "lucide-react";
import { GROUP_COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";

function InfoField({ label, value }) {
  return (
    <div>
      <div className="text-[9px] text-[#6b7280] font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xs text-[#111827] font-medium mt-px">
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-3 last:mb-0">
      {title && (
        <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center gap-1.5">
          {icon && <span className="text-xs">{icon}</span>}
          <span className="text-xs font-bold text-[#1f2937]">{title}</span>
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export default function ProductDetailPanel({ product, onClose }) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from("price_history")
        .select("id, date, unit_price, currency, quantity, supplier_id, suppliers(name)")
        .eq("product_id", product.id)
        .order("date", { ascending: false })
        .limit(20);

      if (!error && data) {
        setPriceHistory(data);
      }
      setLoading(false);
    }
    if (product?.id) fetchHistory();
  }, [product?.id]);

  // Group prices by supplier
  const supplierStats = useMemo(() => {
    const map = {};
    priceHistory.forEach(ph => {
      const sName = ph.suppliers?.name || "Desconocido";
      if (!map[sName]) map[sName] = { prices: [], count: 0, totalQty: 0 };
      map[sName].prices.push(ph.unit_price);
      map[sName].count++;
      map[sName].totalQty += (ph.quantity || 0);
    });
    return Object.entries(map).map(([name, s]) => ({
      name,
      avgPrice: s.prices.reduce((a, b) => a + b, 0) / s.prices.length,
      minPrice: Math.min(...s.prices),
      maxPrice: Math.max(...s.prices),
      transactions: s.count,
      totalQty: s.totalQty,
      currency: priceHistory.find(p => p.suppliers?.name === name)?.currency || "USD",
    })).sort((a, b) => a.avgPrice - b.avgPrice || a.name.localeCompare(b.name));
  }, [priceHistory]);

  const fmt = (n, cur = "USD") => {
    if (!n && n !== 0) return "—";
    if (cur === "PYG" || cur === "GS") return `Gs ${Math.round(n).toLocaleString()}`;
    return `${cur} ${n.toFixed(2)}`;
  };

  return (
    <div
      className="inventory-product-modal fixed inset-0 bg-black/40 z-[1000] flex justify-center items-start pt-[60px] animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
      style={{ "--bg": "#ffffff", "--text": "#111827" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#f8f9fb] rounded-2xl w-[90%] max-w-[520px] max-h-[80vh] overflow-auto shadow-[0_10px_30px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] animate-[slideUp_0.25s_ease]"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#e5e7eb] sticky top-0 bg-white rounded-t-2xl z-[2]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-base font-bold text-[#1f2937] leading-tight">
                {product.name}
              </div>
              <div className="text-[11px] text-[#6b7280] mt-1 flex gap-2 flex-wrap items-center">
                <span className="font-mono text-[10px] bg-[#f3f4f6] px-1.5 py-0.5 rounded font-semibold text-[#374151]">
                  {product.code}
                </span>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                  style={{
                    background: (GROUP_COLORS[product.group] || "#9CA3AF") + "18",
                    color: GROUP_COLORS[product.group] || "#9CA3AF",
                  }}
                >
                  {product.group}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[#f3f4f6] border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm text-[#6b7280] shrink-0 hover:bg-[#e5e7eb] transition-colors"
            >
              {"✕"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          {/* Product info section */}
          <SectionCard title="Producto" icon={<FileText size={14} />}>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {product.manufacturer && (
                <InfoField label="Fabricante" value={product.manufacturer} />
              )}
              {product.presentation && (
                <InfoField label="Presentación" value={product.presentation} />
              )}
              {product.unit && (
                <InfoField label="Unidad" value={product.unit} />
              )}
              {product.species && (
                <InfoField label="Especie" value={product.species} />
              )}
              {product.administration_route && (
                <InfoField label="Vía Admin." value={product.administration_route} />
              )}
              {product.tipo_uso && (
                <InfoField label="Tipo de Uso" value={product.tipo_uso} />
              )}
            </div>
          </SectionCard>

          {/* Deposit / Storage section */}
          {(product.deposit || product.criticality) && (
            <SectionCard title="Depósito / Almacén" icon={<Building2 size={14} />}>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {product.deposit && (
                  <InfoField label="Depósito" value={product.deposit} />
                )}
                {product.criticality && (
                  <InfoField label="Criticidad" value={product.criticality} />
                )}
              </div>
            </SectionCard>
          )}

          {/* Supplier price history section */}
          <SectionCard title="Historial de Proveedores & Precios" icon={<BarChart3 size={14} />}>
            {loading ? (
              <div className="text-xs text-[#6b7280] py-2">
                Cargando historial...
              </div>
            ) : supplierStats.length === 0 ? (
              <div className="bg-[#f9fafb] rounded-lg px-4 py-5 text-center border border-[#e5e7eb]">
                <div className="text-2xl mb-1.5 text-[#6b7280]"><ClipboardList size={28} /></div>
                <div className="text-xs text-[#6b7280] font-medium">
                  Sin historial de compras registrado
                </div>
                <div className="text-[11px] text-[#9ca3af] mt-1">
                  Los precios aparecer{"á"}n a medida que se registren compras
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {supplierStats.map((s, idx) => (
                  <div
                    key={s.name}
                    className="rounded-lg px-3.5 py-3"
                    style={{
                      background: idx === 0 ? "rgba(16,185,129,0.06)" : "#f9fafb",
                      border: `1px solid ${idx === 0 ? "rgba(16,185,129,0.2)" : "#e5e7eb"}`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-[#111827] flex items-center gap-1.5">
                          {idx === 0 && <span className="text-[11px] text-amber-400"><Star size={12} /></span>}
                          {s.name}
                        </div>
                        <div className="text-[10px] text-[#6b7280] mt-0.5">
                          {s.transactions} compra{s.transactions !== 1 ? "s" : ""}
                          {s.totalQty > 0 && ` · ${s.totalQty.toLocaleString()} unidades`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-[15px] font-bold"
                          style={{ color: idx === 0 ? "#059669" : "#1f2937" }}
                        >
                          {fmt(s.avgPrice, s.currency)}
                        </div>
                        <div className="text-[9px] text-[#9ca3af]">
                          promedio/unidad
                        </div>
                      </div>
                    </div>

                    {/* Price range bar */}
                    {s.minPrice !== s.maxPrice && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[#6b7280]">
                        <span>{fmt(s.minPrice, s.currency)}</span>
                        <div className="flex-1 h-[3px] bg-[#e5e7eb] rounded-full relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d1d5db] to-[#9ca3af]" />
                        </div>
                        <span>{fmt(s.maxPrice, s.currency)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent transactions */}
          {priceHistory.length > 0 && (
            <SectionCard title={"Últimas Transacciones"} icon={<Calendar size={14} />}>
              {priceHistory.slice(0, 5).map((ph, idx) => (
                <div
                  key={ph.id || idx}
                  className={`flex justify-between py-1.5 text-[11px] ${idx < 4 ? "border-b border-[#f3f4f6]" : ""}`}
                >
                  <span className="text-[#9ca3af]">
                    {ph.date ? new Date(ph.date).toLocaleDateString("es-PY") : "—"}
                  </span>
                  <span className="text-[#6b7280] flex-1 ml-3">
                    {ph.suppliers?.name || "—"}
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {fmt(ph.unit_price, ph.currency)}
                    {ph.quantity ? ` × ${ph.quantity}` : ""}
                  </span>
                </div>
              ))}
            </SectionCard>
          )}

          {/* Price history placeholder */}
          <div className="bg-white rounded-xl border border-dashed border-[#d1d5db] px-4 py-4 text-center">
            <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
              Historial de Precios (pr{"ó"}ximamente)
            </div>
            <div className="text-[10px] text-[#d1d5db] mt-0.5">
              Gr{"á"}fico de evoluci{"ó"}n de precios
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
