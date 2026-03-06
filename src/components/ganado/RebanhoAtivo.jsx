import { useState, useMemo } from "react";
import { Users, Truck, AlertTriangle, Scale, LayoutList } from "lucide-react";
import Badge from "../shared/Badge";
import SearchInput from "../common/SearchInput";
import HaciendaKpiCard from "./HaciendaKpiCard";

// ─── Mock data ────────────────────────────────────────────────────
const ANIMAIS = [
  { idx:"PY-00412", brinco:"NL-0412", sexo:"M", categoria:"Boi",     peso:487, ultimaPesagem:"2026-02-28", localizacao:"Est. Santa Rosa", lote:"LOTE-23A",  status:"ativo",    ultimaMovimentacao:"2026-02-15" },
  { idx:"PY-00389", brinco:"NL-0389", sexo:"F", categoria:"Vaca",    peso:412, ultimaPesagem:"2026-02-20", localizacao:"Est. Santa Rosa", lote:"LOTE-22B",  status:"ativo",    ultimaMovimentacao:"2026-01-30" },
  { idx:"PY-00451", brinco:"NL-0451", sexo:"M", categoria:"Novilho", peso:318, ultimaPesagem:"2026-01-15", localizacao:"Lucipar",         lote:"LOTE-25A",  status:"transito", ultimaMovimentacao:"2026-02-28" },
  { idx:"PY-00303", brinco:"NL-0303", sexo:"F", categoria:"Novilha", peso:294, ultimaPesagem:"2026-02-25", localizacao:"Hipoti",          lote:"LOTE-20C",  status:"ativo",    ultimaMovimentacao:"2026-02-10" },
  { idx:"PY-00510", brinco:"NL-0510", sexo:"M", categoria:"Boi",     peso:521, ultimaPesagem:"2026-03-01", localizacao:"Est. Santa Rosa", lote:"LOTE-23A",  status:"ativo",    ultimaMovimentacao:"2026-03-01" },
  { idx:"PY-00278", brinco:"NL-0278", sexo:"M", categoria:"Touro",   peso:698, ultimaPesagem:"2026-02-10", localizacao:"Est. Santa Rosa", lote:"REPROD-01", status:"ativo",    ultimaMovimentacao:"2026-01-20" },
  { idx:"PY-00398", brinco:"NL-0398", sexo:"F", categoria:"Vaca",    peso:0,   ultimaPesagem:"2025-11-30", localizacao:"Lucipar",         lote:"LOTE-22B",  status:"alerta",   ultimaMovimentacao:"2026-01-05" },
  { idx:"PY-00427", brinco:"NL-0427", sexo:"M", categoria:"Novilho", peso:355, ultimaPesagem:"2026-02-18", localizacao:"Hipoti",          lote:"LOTE-25A",  status:"ativo",    ultimaMovimentacao:"2026-02-18" },
  { idx:"PY-00488", brinco:"NL-0488", sexo:"F", categoria:"Novilha", peso:277, ultimaPesagem:"2026-02-22", localizacao:"Est. Santa Rosa", lote:"LOTE-24C",  status:"ativo",    ultimaMovimentacao:"2026-02-22" },
  { idx:"PY-00333", brinco:"NL-0333", sexo:"M", categoria:"Boi",     peso:463, ultimaPesagem:"2026-02-05", localizacao:"Frigorifico CDE", lote:"ABATE-06",  status:"saida",    ultimaMovimentacao:"2026-03-04" },
];

const ESTABELECIMENTOS = [
  { nome:"Est. Santa Rosa", total:5, cor:"#C8A03A" },
  { nome:"Lucipar",         total:2, cor:"#8b5cf6" },
  { nome:"Hipoti",          total:2, cor:"#3b82f6" },
  { nome:"Frigorifico CDE", total:1, cor:"#64748b" },
];

const CATEGORIAS = [
  { nome:"Boi",     total:3 },
  { nome:"Vaca",    total:2 },
  { nome:"Novilho", total:2 },
  { nome:"Novilha", total:2 },
  { nome:"Touro",   total:1 },
];

const STATUS_MAP = {
  ativo:    { label:"Ativo",       variant:"success" },
  transito: { label:"Em trânsito", variant:"warning" },
  alerta:   { label:"Alerta",      variant:"danger"  },
  saida:    { label:"Saída",       variant:"default" },
};

// ─── Helpers ──────────────────────────────────────────────────────
const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
const fmtDate   = d => { if (!d) return "—"; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };

// ─── Sidebar panels — SIGAM dark surface tokens ─────────────────
function EstabPanel() {
  const total = ESTABELECIMENTOS.reduce((s,e) => s+e.total, 0);
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3.5">
        Por Estabelecimento
      </div>
      <div className="flex rounded overflow-hidden h-[7px] mb-4">
        {ESTABELECIMENTOS.map(e => (
          <div key={e.nome} style={{ flex: e.total / total, background: e.cor }} />
        ))}
      </div>
      {ESTABELECIMENTOS.map(e => (
        <div key={e.nome} className="flex items-center gap-2 mb-2">
          <div className="w-[9px] h-[9px] rounded-sm shrink-0" style={{ background: e.cor }} />
          <span className="text-[13px] text-slate-300 flex-1">{e.nome}</span>
          <span className="text-xs text-slate-500 font-mono">{e.total}</span>
        </div>
      ))}
    </div>
  );
}

function CatPanel() {
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3.5">
        Por Categoria
      </div>
      {CATEGORIAS.map(c => (
        <div key={c.nome} className="flex items-center gap-2 mb-2.5">
          <span className="text-[13px] text-slate-300 flex-1">{c.nome}</span>
          <div className="flex-[2] h-1 bg-white/[0.06] rounded overflow-hidden">
            <div className="h-full bg-[#C8A03A] rounded" style={{ width: `${(c.total / 3) * 100}%` }} />
          </div>
          <span className="text-xs text-slate-500 font-mono min-w-[16px] text-right">{c.total}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Animal Drawer — SIGAM dark surface tokens ──────────────────
function AnimalDrawer({ animal, onClose }) {
  if (!animal) return null;
  const dias = daysSince(animal.ultimaPesagem);
  const semPeso = dias > 60;
  const st = STATUS_MAP[animal.status] || STATUS_MAP.ativo;

  const timeline = [
    { local:"Est. Santa Rosa", evento:"Entrada no sistema", data:"2025-06-10" },
    { local:"Lucipar",         evento:"Transferência",       data:"2025-10-22" },
    { local:animal.localizacao, evento:"Transferência",      data:animal.ultimaMovimentacao },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-[199]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[360px] bg-[#0d0e14] border-l border-[#C8A03A]/30 shadow-[-6px_0_32px_rgba(0,0,0,0.3)] flex flex-col z-[200] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0a0b0f] px-6 py-[22px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#C8A03A] uppercase tracking-[0.14em] font-mono mb-1">IDX</div>
              <div className="text-[26px] font-bold text-white/95 leading-none">{animal.idx}</div>
              <div className="text-[13px] text-white/55 mt-1">
                {animal.brinco} · {animal.sexo === "M" ? "♂" : "♀"} {animal.categoria}
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/[0.08] border-none text-white/70 w-8 h-8 rounded-[7px] cursor-pointer text-base flex items-center justify-center hover:bg-white/[0.12] transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-3.5">
            <Badge variant={st.variant} dot>{st.label}</Badge>
          </div>
        </div>

        <div className="p-[22px] flex flex-col gap-5">
          {/* Data grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Peso atual",        animal.peso > 0 ? `${animal.peso} kg` : "Sem dado", semPeso ? "text-red-400" : "text-slate-200"],
              ["Última pesagem",    fmtDate(animal.ultimaPesagem),                       semPeso ? "text-red-400" : "text-slate-200"],
              ["Localização",       animal.localizacao,                                  "text-slate-200"],
              ["Lote",              animal.lote,                                         "text-slate-200"],
              ["Últ. movimentação", fmtDate(animal.ultimaMovimentacao),                  "text-slate-400"],
            ].map(([l, v, colorClass]) => (
              <div key={l} className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{l}</div>
                <div className={`text-[13px] font-mono font-medium ${colorClass}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3.5">
              Rastreabilidade
            </div>
            {timeline.map((ev, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center w-[18px]">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-[3px] border-2 ${
                    i === timeline.length - 1
                      ? "bg-[#C8A03A] border-[#C8A03A]"
                      : "bg-white/[0.06] border-white/[0.12]"
                  }`} />
                  {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-white/[0.06] my-[3px]" />}
                </div>
                <div className="pb-3.5">
                  <div className="text-[13px] text-slate-300 font-medium">{ev.local}</div>
                  <div className="text-[12px] text-slate-500">{ev.evento} · {fmtDate(ev.data)}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="bg-[#F8F9FB]/[0.03] text-[#C8A03A] border border-[#C8A03A]/30 rounded-lg py-[11px] text-[13px] font-semibold cursor-pointer tracking-wide w-full hover:bg-[#C8A03A]/10 transition-colors">
            Abrir ficha completa →
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function RebanhoAtivo() {
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterLocal,  setFilterLocal]  = useState("todos");
  const [sortBy,       setSortBy]       = useState("idx");
  const [sortDir,      setSortDir]      = useState("asc");
  const [selected,     setSelected]     = useState(null);

  const ativos     = ANIMAIS.filter(a => a.status !== "saida").length;
  const emTransito = ANIMAIS.filter(a => a.status === "transito").length;
  const alertas    = ANIMAIS.filter(a => a.status === "alerta").length;
  const pesoMedio  = Math.round(
    ANIMAIS.filter(a => a.peso > 0).reduce((s, a) => s + a.peso, 0) /
    ANIMAIS.filter(a => a.peso > 0).length
  );

  const locais     = ["todos", ...new Set(ANIMAIS.map(a => a.localizacao))];
  const statusOpts = ["todos", "ativo", "transito", "alerta", "saida"];

  const filtered = useMemo(() => {
    return ANIMAIS
      .filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q || [a.idx, a.brinco, a.lote, a.localizacao].some(s => s.toLowerCase().includes(q));
        return matchSearch
          && (filterStatus === "todos" || a.status === filterStatus)
          && (filterLocal  === "todos" || a.localizacao === filterLocal);
      })
      .sort((a, b) => {
        let va = a[sortBy], vb = b[sortBy];
        if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [search, filterStatus, filterLocal, sortBy, sortDir]);

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const COLS = [
    ["idx", "IDX"], ["brinco", "Brinco"], ["categoria", "Categoria"],
    ["peso", "Peso kg"], ["ultimaPesagem", "Última pesagem"],
    ["localizacao", "Localización"], ["lote", "Lote"],
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <HaciendaKpiCard label="Animais ativos" value={ativos} sub="no rebanho" icon={<Users size={18} />} color="#22c55e" />
        <HaciendaKpiCard label="Em trânsito" value={emTransito} sub="guia aberta" icon={<Truck size={18} />} color="#C8A03A" />
        <HaciendaKpiCard label="Alertas" value={alertas} sub="sem leitura recente" icon={<AlertTriangle size={18} />} color="#ef4444" />
        <HaciendaKpiCard label="Peso médio" value={`${pesoMedio} kg`} sub="rebanho com pesagem" icon={<Scale size={18} />} color="#8b5cf6" />
        <HaciendaKpiCard label="Total geral" value={ANIMAIS.length} sub="incl. saídas" icon={<LayoutList size={18} />} color="#64748b" />
      </div>

      {/* Alert banner */}
      {alertas > 0 && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5 flex items-center gap-2.5 mb-4">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <span className="text-[13px] text-red-400">
            <strong>{alertas} animal{alertas > 1 ? "is" : ""}</strong> sem pesagem há mais de 90 dias
          </span>
        </div>
      )}

      {/* Sidebar + Table layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-3.5 items-start">
        <div className="flex flex-col gap-3">
          <EstabPanel />
          <CatPanel />
        </div>

        {/* Table card — matches RequestsTable pattern */}
        <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Filters row */}
          <div className="p-3.5 border-b border-white/[0.06] flex gap-2.5 flex-wrap items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar IDX, brinco, lote…"
              className="flex-1 min-w-[180px]"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-[#F8F9FB]/[0.05] border border-white/[0.1] text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#C8A03A]/50"
            >
              {statusOpts.map(s => (
                <option key={s} value={s}>{s === "todos" ? "Todos os status" : STATUS_MAP[s]?.label || s}</option>
              ))}
            </select>
            <select
              value={filterLocal}
              onChange={e => setFilterLocal(e.target.value)}
              className="bg-[#F8F9FB]/[0.05] border border-white/[0.1] text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#C8A03A]/50"
            >
              {locais.map(l => <option key={l} value={l}>{l === "todos" ? "Todos os locais" : l}</option>)}
            </select>
            <span className="text-[11px] text-slate-500 font-mono">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table — matches RequestsTable dark pattern */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB]/[0.05]">
                  {COLS.map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className="px-3.5 py-3 text-left text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-white/[0.06] cursor-pointer select-none whitespace-nowrap"
                    >
                      {label}
                      <span className={`ml-1 ${sortBy === col ? "text-[#C8A03A]" : "text-slate-600"}`}>
                        {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </th>
                  ))}
                  <th className="px-3.5 py-3 text-left text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-white/[0.06]">
                    Status
                  </th>
                  <th className="px-3.5 py-3 border-b border-white/[0.06]" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-9 text-center text-[13px] text-slate-500">
                      Nenhum animal com esses filtros
                    </td>
                  </tr>
                )}
                {filtered.map((a, i) => {
                  const dias   = daysSince(a.ultimaPesagem);
                  const antigo = dias > 60;
                  const isSel  = selected?.idx === a.idx;
                  const st     = STATUS_MAP[a.status] || STATUS_MAP.ativo;
                  return (
                    <tr
                      key={a.idx}
                      onClick={() => setSelected(isSel ? null : a)}
                      className={`border-b border-white/[0.06] cursor-pointer transition-colors ${
                        isSel
                          ? "bg-[#1F2A44]/[0.08]"
                          : i % 2 === 0
                            ? "bg-transparent hover:bg-[#1F2A44]/[0.04]"
                            : "bg-[#F8F9FB]/[0.02] hover:bg-[#1F2A44]/[0.04]"
                      }`}
                    >
                      <td className="px-3.5 py-2.5">
                        <span className="font-mono text-[13px] text-[#C8A03A] font-medium">{a.idx}</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[13px] text-slate-300">{a.brinco}</td>
                      <td className="px-3.5 py-2.5 text-[13px] text-slate-400">
                        {a.sexo === "M" ? "♂" : "♀"} {a.categoria}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`font-mono text-[13px] font-medium ${a.peso > 0 ? "text-slate-200" : "text-red-400"}`}>
                          {a.peso > 0 ? a.peso : "—"}
                        </span>
                      </td>
                      <td className={`px-3.5 py-2.5 text-[13px] ${antigo ? "text-red-400" : "text-slate-400"}`}>
                        {fmtDate(a.ultimaPesagem)}
                        {antigo && <span className="ml-1.5 text-[11px]">({dias}d)</span>}
                      </td>
                      <td className="px-3.5 py-2.5 text-[13px] text-slate-300">{a.localizacao}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-mono text-[11px] text-slate-400 bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded px-[7px] py-[2px]">
                          {a.lote}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant={st.variant} dot>{st.label}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(isSel ? null : a); }}
                          className="bg-transparent border border-white/[0.08] rounded-md px-2.5 py-1 text-[12px] text-slate-400 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:text-slate-300 transition-colors whitespace-nowrap"
                        >
                          Ver ficha →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimalDrawer animal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
