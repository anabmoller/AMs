import { useState, useMemo } from "react";
import { INVENTORY_ITEMS, GROUP_COLORS } from "../../constants";
import SearchInput from "../common/SearchInput";

export default function InventoryModal({ onSelect, onClose, onNewProduct }) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  // Get unique groups
  const groups = useMemo(() => {
    const g = [...new Set(INVENTORY_ITEMS.map(i => i.group))];
    return ["all", ...g.sort()];
  }, []);

  const filtered = useMemo(() => {
    let items = INVENTORY_ITEMS;
    if (activeGroup !== "all") {
      items = items.filter(i => i.group === activeGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeGroup]);

  // Group items by group for display
  const groupedItems = useMemo(() => {
    if (activeGroup !== "all") return { [activeGroup]: filtered };
    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [filtered, activeGroup]);


  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
    >
      <div className="bg-[#0a0b0f] rounded-2xl max-w-[560px] w-full max-h-[70vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="px-5 pt-5">
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <h3 className="text-xl font-semibold text-white m-0">
                Catálogo de Productos
              </h3>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {INVENTORY_ITEMS.length} productos disponibles
              </div>
            </div>
            <button onClick={onClose} className="bg-white/[0.06] border-none w-8 h-8 rounded-lg cursor-pointer text-base text-white flex items-center justify-center">
              ✕
            </button>
          </div>

          {/* Search */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, código o tipo..."
            autoFocus
            style={{ marginBottom: 10 }}
          />

          {/* Group pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
            {groups.map(g => {
              const groupColor = g === "all" ? "#10b981" : (GROUP_COLORS[g] || "#10b981");
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap flex-shrink-0"
                  style={{
                    border: activeGroup === g
                      ? `2px solid ${groupColor}`
                      : '1px solid rgba(255,255,255,0.06)',
                    background: activeGroup === g
                      ? groupColor + "12"
                      : 'rgba(255,255,255,0.03)',
                    color: activeGroup === g ? groupColor : '#94a3b8',
                  }}
                >
                  {g === "all" ? `Todos (${INVENTORY_ITEMS.length})` : g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Items list */}
        <div className="overflow-auto px-5 pb-5 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-[13px]">
              No se encontraron productos para "{search}"
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, items]) => (
              <div key={group}>
                {activeGroup === "all" && (
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wide py-2.5 pb-1.5 flex items-center gap-1.5"
                    style={{ color: GROUP_COLORS[group] || '#94a3b8' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-sm"
                      style={{ background: GROUP_COLORS[group] || '#94a3b8' }}
                    />
                    {group} ({items.length})
                  </div>
                )}
                {items.map(item => (
                  <div
                    key={item.code}
                    onClick={() => onSelect(item)}
                    className="bg-white/[0.03] rounded-xl px-3.5 py-3 mb-1 cursor-pointer border border-white/[0.06] flex justify-between items-center transition-all duration-150 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]"
                  >
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-white/[0.02] px-1.5 py-px rounded">
                          {item.code}
                        </span>
                        <span>·</span>
                        <span>{item.group}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ml-2"
                      style={{
                        background: (GROUP_COLORS[item.group] || "#10b981") + "12",
                        color: GROUP_COLORS[item.group] || "#10b981",
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* New product option */}
          <div
            onClick={onNewProduct}
            className="bg-blue-400/[0.04] rounded-xl p-4 mt-3 cursor-pointer border border-dashed border-blue-400/25 text-center transition-all duration-150 hover:bg-blue-400/[0.06]"
          >
            <div className="text-[13px] font-semibold text-blue-400">
              + Agregar producto nuevo
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ¿No está en el catálogo? Créalo manualmente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
