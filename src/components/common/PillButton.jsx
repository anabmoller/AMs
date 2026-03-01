export default function PillButton({ active, onClick, label, color, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`py-[7px] px-3.5 rounded-full border-none text-xs font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
        active ? "text-white" : "bg-white/[0.03] text-slate-400 shadow-sm"
      }`}
      style={
        active
          ? { background: color, boxShadow: `0 2px 12px ${color}30` }
          : undefined
      }
    >
      {label}
    </button>
  );
}
