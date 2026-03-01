// ============================================================
// YPOTI — RequestDetail — Módulo 3 (PRD Completo)
// Detalle Precoro-style: Header, InfoGrid, Items, Comments,
// Trazabilidad, Approval, Budget, Quotations, Attachments
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { STATUS_FLOW, URGENCY_LEVELS, PRIORITY_LEVELS } from "../../constants";
import { generateCommentId } from "../../utils/ids";
import AddItemModal from "./AddItemModal";
import AttachmentUpload from "./AttachmentUpload";
import QuotationPanel from "../quotations/QuotationPanel";
import ApprovalFlow from "../approval/ApprovalFlow";
import ApprovalActions from "../approval/ApprovalActions";
import BudgetWidget from "../approval/BudgetWidget";
import { useAuth } from "../../context/AuthContext";
import { formatGuaranies } from "../../constants/budgets";
import { getStatusDisplay, getPriorityDisplay } from "../../utils/statusHelpers";
import { fmtDate, fmtDateTime } from "../../utils/dateFormatters";
import { getSectors, getProductTypes } from "../../constants/parameters";

// ---- Sub-components ----

function SectionTitle({ children, count, collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between select-none ${collapsed ? '' : 'mb-3'} ${onToggle ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
        {children}
        {count != null && (
          <span className="bg-emerald-500/[0.08] text-emerald-400 text-[10px] font-bold px-1.5 py-px rounded-md min-w-[18px] text-center">
            {count}
          </span>
        )}
      </div>
      {onToggle && (
        <span
          className="text-sm text-slate-400 transition-transform duration-200"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
        >
          ▾
        </span>
      )}
    </div>
  );
}

function InfoGrid({ children }) {
  return (
    <div className="info-grid grid grid-cols-2 gap-0 bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

function InfoCell({ label, value, color, icon, span2 }) {
  return (
    <div
      className={`px-4 py-3 border-b border-white/[0.06] ${span2 ? 'col-span-full' : ''}`}
    >
      <div className="text-[11px] text-slate-400 font-medium mb-0.5">{label}</div>
      <div
        className="text-[13px] font-medium text-white flex items-center gap-1"
        style={color ? { color } : undefined}
      >
        {icon && <span className="text-xs">{icon}</span>}
        {value || "—"}
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, color, bg, outline, onClick, flex }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
        outline
          ? 'bg-transparent border-[1.5px]'
          : 'border-none text-white shadow-sm'
      }`}
      style={{
        flex: flex || 1,
        ...(outline
          ? { borderColor: color || 'rgba(255,255,255,0.06)', color: color || '#fff' }
          : { background: bg || color || '#10b981' }),
      }}
    >
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function NavBtn({ icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border-none text-[13px] font-medium px-2 py-1.5 flex items-center gap-0.5 ${
        disabled ? 'cursor-default text-white/[0.15] opacity-40' : 'cursor-pointer text-emerald-400'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function RequestDetail({
  request: r, onBack, onAdvance, onUpdateRequest, canManageQuotations,
  onConfirm, onApprove, onReject, onRevision,
  onPrev, onNext, hasPrev, hasNext,
}) {
  const { currentUser } = useAuth();
  const [showQuotations, setShowQuotations] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // Comments state
  const [comments, setComments] = useState(r.comments || []);
  const [commentText, setCommentText] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);

  // Editable note (maps to `reason` column in DB)
  const [note, setNote] = useState(r.reason || r.notes || "");
  const noteTimer = useRef(null);
  const saveNote = useCallback((val) => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      if (onUpdateRequest) onUpdateRequest(r.id, { reason: val });
    }, 500);
  }, [r.id, onUpdateRequest]);

  // Collapsible sections
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Items state (editable in borrador)
  const [items, setItems] = useState(r.items || []);

  // Attachments state
  const [attachments, setAttachments] = useState(r.adjuntos || []);

  // Sync state if request changes
  useEffect(() => {
    setComments(r.comments || []);
    setNote(r.reason || r.notes || "");
    setItems(r.items || []);
    setAttachments(r.adjuntos || []);
  }, [r.id, r.comments, r.notes, r.reason, r.items, r.adjuntos]);

  const status = getStatusDisplay(r.status);
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === r.status);
  const isLast = statusIdx === STATUS_FLOW.length - 1;
  const isRejected = r.status === "rechazado";
  const isBorrador = r.status === "borrador";
  const isInApproval = r.status === "pendiente_aprobacion";

  const urgency = URGENCY_LEVELS.find(u => u.value === (r.priority || r.urgency));
  const priority = getPriorityDisplay(r.priority || r.urgency);
  const showQuotationBtn = canManageQuotations && statusIdx >= 2;
  const quotationCount = r.quotations?.length || 0;

  // Items total — handles both DB field names (English) and AddItemModal field names (Spanish)
  const itemsTotal = items.reduce((sum, it) => {
    const price = it.unitPrice || it.precioUnitario || 0;
    const qty = it.quantity || it.cantidad || 0;
    return sum + (price * qty);
  }, 0);
  const displayTotal = itemsTotal > 0 ? itemsTotal : (r.totalAmount || 0);

  // ---- Handlers ----
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: generateCommentId(),
      author: currentUser.name,
      autor: currentUser.name,
      avatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
      fecha: new Date().toISOString(),
      texto: commentText.trim(),
      interno: commentInternal,
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setCommentText("");
    setCommentInternal(false);
    if (onUpdateRequest) onUpdateRequest(r.id, { comments: updated });
  };

  const calcItemsTotal = (arr) => arr.reduce((s, it) => {
    const price = it.unitPrice || it.precioUnitario || 0;
    const qty = it.quantity || it.cantidad || 0;
    return s + (price * qty);
  }, 0);

  const handleRemoveItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    if (onUpdateRequest) onUpdateRequest(r.id, { items: updated, totalAmount: calcItemsTotal(updated) });
  };

  const handleAddItem = (item) => {
    const updated = [...items, item];
    setItems(updated);
    setShowAddItem(false);
    if (onUpdateRequest) onUpdateRequest(r.id, { items: updated, totalAmount: calcItemsTotal(updated) });
  };

  const handleAttachmentsChange = (updated) => {
    setAttachments(updated);
    if (onUpdateRequest) onUpdateRequest(r.id, { adjuntos: updated });
  };

  // ---- RENDER ----
  return (
    <div className="animate-fadeIn pb-[100px]">

      {/* ===== HEADER ===== */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] sticky top-0 z-20">
        <div className="flex items-center gap-1">
          <NavBtn icon="✕" onClick={onBack} />
          <div className="w-px h-[18px] bg-white/[0.06] mx-0.5" />
          <NavBtn icon="←" label="" onClick={onPrev} disabled={!hasPrev} />
          <NavBtn icon="→" label="" onClick={onNext} disabled={!hasNext} />
        </div>

        <div className="text-xs font-semibold text-white text-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-2">
          {r.id}
        </div>

        {/* Status badge */}
        <div
          className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded whitespace-nowrap"
          style={{
            color: status.color,
            background: status.colorLight || (status.color + "14"),
            border: `1px solid ${status.color}20`,
          }}
        >
          {status.icon} {status.label}
        </div>
      </div>

      {/* ===== TITLE + PRIORITY ===== */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start gap-2.5 mb-1">
          <h2 className="text-xl font-semibold text-white m-0 leading-tight flex-1">
            {r.name}
          </h2>
          {priority && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
              style={{
                color: priority.color,
                background: priority.colorLight || (priority.color + "12"),
              }}
            >
              {priority.icon} {priority.label}
            </span>
          )}
        </div>
        {r.supplier && (
          <div className="text-xs text-slate-500 mt-0.5">
            Proveedor: {r.supplier}
          </div>
        )}
      </div>

      {/* ===== REJECTED BANNER ===== */}
      {isRejected && (
        <div className="px-5 pb-2">
          <div className="bg-red-500/[0.08] border border-red-500/[0.12] rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-xl">❌</span>
            <div>
              <div className="text-[13px] font-semibold text-red-400">Solicitud Rechazada</div>
              {r.approvalHistory?.length > 0 && (
                <div className="text-xs text-red-400/80 mt-0.5">
                  {r.approvalHistory[r.approvalHistory.length - 1].note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVAL ACTIONS (for current approver) ===== */}
      {isInApproval && r.approvalSteps && (
        <div className="px-5 mb-3">
          <ApprovalActions
            request={r} currentUser={currentUser}
            onApprove={onApprove} onReject={onReject} onRevision={onRevision}
          />
        </div>
      )}

      {/* ===== PROGRESS BAR ===== */}
      {!isRejected && statusIdx >= 0 && (
        <div className="px-5 pb-1">
          <div className="flex gap-0.5 mb-1.5 px-0.5">
            {STATUS_FLOW.map((s, i) => (
              <div
                key={s.key}
                className="flex-1 h-[5px] rounded-sm transition-colors duration-300"
                style={{ background: i <= statusIdx ? status.color : 'rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-xs font-medium" style={{ color: status.color }}>
              Paso {statusIdx + 1} de {STATUS_FLOW.length}
            </span>
            <div className="flex gap-1.5">
              {isBorrador && onConfirm && (
                <button
                  onClick={() => onConfirm(r.id)}
                  className="bg-emerald-500 text-white border-none rounded px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer shadow-sm"
                >
                  Confirmar ✓
                </button>
              )}
              {!isBorrador && !isInApproval && !isLast && !isRejected && onAdvance && (
                <button
                  onClick={() => onAdvance(r.id)}
                  className="text-white border-none rounded px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer shadow-sm"
                  style={{ background: STATUS_FLOW[statusIdx + 1]?.color || '#10b981' }}
                >
                  → {STATUS_FLOW[statusIdx + 1]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVAL FLOW (dots) ===== */}
      {r.approvalSteps?.length > 0 && (
        <div className="px-5 py-2">
          <ApprovalFlow steps={r.approvalSteps} />
        </div>
      )}

      {/* ===== INFO GRID ===== */}
      <div className="px-5 py-2">
        <InfoGrid>
          <InfoCell label="Solicitante" value={r.requester} icon="👤" />
          <InfoCell label="Fecha de Creación" value={fmtDate(r.date)} />
          <InfoCell label="Establecimiento" value={r.establishment} />
          <InfoCell
            label="Urgencia"
            value={priority?.label || r.priority || r.urgency || "—"}
            color={urgency?.color}
            icon={urgency?.icon}
          />
          <InfoCell
            label="Sector"
            value={r.sector || r.type}
            icon={getSectors().find(s => s.name === (r.sector || r.type))?.icon}
          />
          <InfoCell
            label="Tipo de Producto"
            value={r.type}
            icon={getProductTypes().find(t => t.name === r.type)?.icon}
          />
          <InfoCell label="Cantidad" value={r.quantity} />
          <InfoCell label="Asignado a" value={r.assignee || "Sin asignar"} />
          {r.equipment && <InfoCell label="Equipo" value={r.equipment} span2 />}
          {displayTotal > 0 && (
            <InfoCell label="Total Estimado" value={formatGuaranies(displayTotal)} color="#10b981" span2 />
          )}
        </InfoGrid>
      </div>

      {/* ===== NOTE (editable) ===== */}
      <div className="px-5 py-2">
        <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
          <div className="text-[11px] text-slate-400 font-medium mb-1.5">
            Nota / Motivo
          </div>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); saveNote(e.target.value); }}
            placeholder="+ Agregar nota..."
            rows={2}
            className="w-full border-none bg-transparent text-[13px] text-white resize-none outline-none p-0 leading-relaxed"
          />
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <div className="px-5 py-2">
        <SectionTitle count={items.length}>Items</SectionTitle>
        {items.length > 0 ? (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
            {items.map((it, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 flex justify-between items-start ${idx < items.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-[#0a0b0f] px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    {(it.codigo || it.code) && (
                      <span className="text-[10px] text-emerald-400 font-semibold">{it.codigo || it.code}</span>
                    )}
                  </div>
                  <div className="text-[13px] font-semibold text-white mt-0.5">
                    {it.name || it.nombre || "Item"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {it.quantity || it.cantidad || 0} {it.unit || it.unidad || "un"} × {formatGuaranies(it.unitPrice || it.precioUnitario || 0)}
                  </div>
                  {(it.proveedor || it.supplier) && (
                    <div className="text-[10px] text-slate-400 mt-px">
                      Prov: {it.proveedor || it.supplier}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-bold text-white">
                    {formatGuaranies((it.unitPrice || it.precioUnitario || 0) * (it.quantity || it.cantidad || 0))}
                  </div>
                  {isBorrador && (
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="bg-transparent border-none text-sm cursor-pointer p-1 text-red-400 mt-0.5"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
            {/* Total footer */}
            <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">
                TOTAL ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
              <span className="text-[15px] font-bold text-emerald-400">
                {formatGuaranies(itemsTotal || displayTotal)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06] text-center">
            <div className="text-[13px] text-slate-400">Sin items registrados</div>
            {displayTotal > 0 && (
              <div className="text-sm font-semibold text-emerald-400 mt-1.5">
                Monto estimado: {formatGuaranies(displayTotal)}
              </div>
            )}
          </div>
        )}
        {/* Add item button (borrador only) */}
        {isBorrador && (
          <button
            onClick={() => setShowAddItem(true)}
            className="w-full p-3 rounded-xl mt-2 border border-dashed border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-400 text-xs font-semibold cursor-pointer"
          >
            + Agregar Item
          </button>
        )}
      </div>

      {/* ===== BUDGET WIDGET ===== */}
      <div className="px-5 py-2">
        <BudgetWidget
          establishment={r.establishment}
          sector={r.sector || r.type}
          requestAmount={displayTotal}
        />
      </div>

      {/* ===== QUOTATIONS ===== */}
      {(showQuotationBtn || quotationCount > 0) && (
        <div className="px-5 py-2">
          <div
            className="rounded-xl p-4"
            style={{
              background: r.status === "cotizacion" ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${r.status === "cotizacion" ? 'rgba(16,185,129,0.19)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className={`flex justify-between items-center ${quotationCount > 0 ? 'mb-2.5' : ''}`}>
              <SectionTitle count={quotationCount}>Cotizaciones</SectionTitle>
              {canManageQuotations && (
                <button
                  onClick={() => setShowQuotations(true)}
                  className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-lg px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                >
                  {quotationCount > 0 ? "Ver / Editar" : "+ Agregar"}
                </button>
              )}
            </div>
            {quotationCount > 0 && (
              <div className="flex flex-col gap-1.5">
                {r.quotations.slice(0, 3).map(q => (
                  <div
                    key={q.id}
                    className="flex justify-between rounded-lg px-2.5 py-2"
                    style={{
                      background: q.selected ? 'rgba(34,197,94,0.06)' : 'rgba(10,11,15,1)',
                      border: q.selected ? '1px solid rgba(34,197,94,0.19)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className={`text-xs text-white ${q.selected ? 'font-semibold' : 'font-normal'}`}>
                      {q.selected && "✓ "}{q.supplier}
                    </span>
                    <span className={`text-xs font-semibold ${q.selected ? 'text-green-400' : 'text-white'}`}>
                      {q.currency} {q.price?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {quotationCount > 3 && (
                  <div className="text-[11px] text-slate-400 text-center">
                    +{quotationCount - 3} mas...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== COMMENTS ===== */}
      <div className="px-5 py-2">
        <SectionTitle count={comments.length}>Comentarios</SectionTitle>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Comment list */}
          {comments.length > 0 ? (
            <div>
              {comments.map((c, i) => (
                <div
                  key={c.id || i}
                  className={`px-4 py-3 ${i < comments.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {(c.avatar || (c.author || c.autor || "?")?.[0] || "?").toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-white">{c.author || c.autor}</span>
                    {c.interno && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-400/[0.08] px-1.5 py-px rounded uppercase tracking-wide">
                        Interno
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {fmtDateTime(c.createdAt || c.fecha)}
                    </span>
                  </div>
                  <div className="text-[13px] text-white leading-relaxed pl-[34px]">
                    {c.texto}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Sin comentarios aún
            </div>
          )}

          {/* Comment input */}
          <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Agregar comentario..."
                rows={1}
                className="flex-1 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-white bg-white/[0.03] resize-none outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className={`border-none rounded-lg px-3.5 text-xs font-semibold ${
                  commentText.trim()
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer'
                    : 'bg-white/[0.06] text-slate-500 cursor-default'
                }`}
              >
                →
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={commentInternal}
                onChange={(e) => setCommentInternal(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-400"
              />
              Solo empresa (interno)
            </label>
          </div>
        </div>
      </div>

      {/* ===== TRAZABILIDAD (collapsible) ===== */}
      <div className="px-5 py-2">
        <SectionTitle
          count={(r.approvalHistory?.length || 0) + STATUS_FLOW.length}
          collapsed={!showTrazabilidad}
          onToggle={() => setShowTrazabilidad(!showTrazabilidad)}
        >
          Trazabilidad
        </SectionTitle>

        {/* Always show last 3 approval history entries */}
        {r.approvalHistory?.length > 0 && (
          <div className={showTrazabilidad ? 'mb-2' : ''}>
            {(showTrazabilidad ? r.approvalHistory : r.approvalHistory.slice(-3)).map((entry, i) => {
              const actionStyles = {
                confirmed: { icon: "📤", color: "#3b82f6", label: "Confirmada" },
                approved: { icon: "✅", color: "#22c55e", label: "Aprobada" },
                rejected: { icon: "❌", color: "#ef4444", label: "Rechazada" },
                revision: { icon: "↩", color: "#f59e0b", label: "Devuelta" },
                advanced: { icon: "→", color: "#10b981", label: "Avanzada" },
              };
              const a = actionStyles[entry.action] || { icon: "•", color: "#94a3b8", label: entry.action };
              return (
                <div key={i} className="flex gap-2.5 mb-1.5 p-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-sm">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: a.color }}>
                      {entry.step ? `${entry.step}: ` : ""}{a.label}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-px">
                      {entry.by} · {fmtDateTime(entry.at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pipeline timeline (shown when expanded) */}
        {showTrazabilidad && (
          <div className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
            {STATUS_FLOW.map((s, i) => {
              const reached = i <= statusIdx;
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center w-6">
                    <div
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] text-white transition-all duration-300"
                      style={{
                        background: reached ? s.color : 'rgba(255,255,255,0.06)',
                        border: i === statusIdx ? `2px solid ${s.color}` : 'none',
                        boxShadow: i === statusIdx ? `0 0 0 3px ${s.color}20` : 'none',
                      }}
                    >
                      {reached ? "✓" : ""}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className="w-0.5 h-[22px]"
                        style={{ background: i < statusIdx ? s.color : 'rgba(255,255,255,0.06)' }}
                      />
                    )}
                  </div>
                  <div className="pb-2 min-w-0">
                    <div
                      className={`text-xs ${reached ? 'font-semibold text-white' : 'font-normal text-slate-400'}`}
                    >
                      {s.icon} {s.label}
                    </div>
                    {reached && i === 0 && (
                      <div className="text-[10px] text-slate-400">{fmtDate(r.date)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!showTrazabilidad && (r.approvalHistory?.length || 0) === 0 && (
          <div className="text-xs text-slate-400 py-1.5">
            Sin historial de acciones todavía
          </div>
        )}
      </div>

      {/* ===== ATTACHMENTS ===== */}
      <div className="px-5 py-2">
        <SectionTitle
          count={attachments.length}
          collapsed={!showAttachments}
          onToggle={() => setShowAttachments(!showAttachments)}
        >
          Adjuntos
        </SectionTitle>
        {showAttachments && (
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <AttachmentUpload
              requestUuid={r._uuid}
              attachments={attachments}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </div>
        )}
      </div>

      {/* ===== MOBILE BOTTOM ACTION BAR ===== */}
      <div className="mobile-bottom-action-bar fixed bottom-16 left-0 right-0 px-5 py-2.5 bg-white/[0.03] border-t border-white/[0.06] flex gap-2 z-30 max-w-[480px] mx-auto">
        {isBorrador && onConfirm && (
          <ActionBtn label="Confirmar ✓" color="#10b981" bg="linear-gradient(135deg, #10b981, #059669)" onClick={() => onConfirm(r.id)} flex={2} />
        )}
        {!isBorrador && !isInApproval && !isLast && !isRejected && onAdvance && (
          <ActionBtn
            label={`→ ${STATUS_FLOW[statusIdx + 1]?.label || "Avanzar"}`}
            color={STATUS_FLOW[statusIdx + 1]?.color || "#10b981"}
            onClick={() => onAdvance(r.id)}
            flex={2}
          />
        )}
        {(isBorrador || (!isBorrador && !isInApproval && !isLast && !isRejected)) && (
          <ActionBtn label="✕" color="#ef4444" outline onClick={onBack} />
        )}
        {isInApproval && (
          <div className="flex-1 text-xs text-slate-400 flex items-center justify-center">
            ⏳ Acciones de aprobación arriba
          </div>
        )}
        {isRejected && (
          <div className="flex-1 text-xs text-red-400 flex items-center justify-center font-medium">
            ❌ Solicitud rechazada
          </div>
        )}
        {isLast && (
          <div className="flex-1 text-xs text-green-400 flex items-center justify-center font-medium">
            ✅ Proceso completado
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      {showQuotations && (
        <QuotationPanel
          request={r}
          onClose={() => setShowQuotations(false)}
          onSave={(reqId, updates) => { onUpdateRequest(reqId, updates); setShowQuotations(false); }}
        />
      )}
      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} onAdd={handleAddItem} />
      )}

      {/* InfoGrid responsive style */}
      <style>{`
        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) {
          .mobile-bottom-action-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
