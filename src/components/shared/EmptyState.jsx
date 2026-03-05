import { Inbox } from "lucide-react";

export default function EmptyState({ icon, title, description, action, onAction }) {
  const defaultIcon = <Inbox size={40} className="text-slate-500" />;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#1F2A44]/20 text-[#C8A03A] rounded-lg text-sm font-medium hover:bg-[#1F2A44]/30 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}
