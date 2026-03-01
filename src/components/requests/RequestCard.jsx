import { getStatusDisplay, getStatusProgress, getPriorityDisplay, formatGuaranies } from "../../utils/statusHelpers";
import { getSectors } from "../../constants/parameters";

export default function RequestCard({ request: r, onClick }) {
  const status = getStatusDisplay(r.status);
  const priority = getPriorityDisplay(r.priority || r.urgency);
  const progress = getStatusProgress(r.status);

  return (
    <div
      onClick={onClick}
      className="bg-white/[0.03] rounded-xl px-4 py-3.5 mb-2 border border-white/[0.06] cursor-pointer transition-all duration-150 relative overflow-hidden hover:border-emerald-500/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)]"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/[0.06]">
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${progress}%`, background: status.color }}
        />
      </div>

      {/* Top row: ID + Priority */}
      <div className="flex justify-between items-center mb-1.5 pt-0.5">
        <span className="text-[11px] text-slate-500 font-medium font-sans">
          {r.id} · {r.date}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: priority.color, background: priority.colorLight }}
        >
          {priority.icon} {priority.label}
        </span>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold text-white leading-snug mb-2">
        {r.name}
      </div>

      {/* Status + Meta */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <span
          className="text-[11px] px-2 py-[3px] rounded-md font-semibold"
          style={{
            background: status.colorLight || (status.color + "12"),
            color: status.color,
          }}
        >
          {status.label}
        </span>
        <span className="text-[11px] text-slate-400">
          {r.establishment}
        </span>
        {r.sector && (
          <span className="text-[11px] text-slate-500">
            · {getSectors().find(s => s.name === r.sector)?.icon || ""} {r.sector}
          </span>
        )}
        {r.totalAmount > 0 && (
          <span className="text-xs font-semibold text-white ml-auto font-sans">
            {formatGuaranies(r.totalAmount)}
          </span>
        )}
      </div>

      {/* Requester */}
      {r.requester && (
        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <span className="w-[18px] h-[18px] rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold inline-flex items-center justify-center">
            {r.requester.charAt(0)}
          </span>
          <span className="font-medium text-slate-300">{r.requester}</span>
          {r.assignee && (
            <>
              <svg width="12" height="12" viewBox="0 0 20 20" className="fill-slate-500">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
              <span>{r.assignee}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
