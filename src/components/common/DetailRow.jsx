export default function DetailRow({ label, value, color, last }) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-3 ${
        last ? "" : "border-b border-white/[0.06]"
      }`}
    >
      <span className="text-[13px] text-slate-400">{label}</span>
      <span
        className="text-[13px] font-medium text-right max-w-[60%]"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
