export default function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border-none flex flex-col items-center gap-0.5 cursor-pointer px-3 py-1"
    >
      <span className={`text-xl ${active ? "opacity-100" : "opacity-40"}`}>
        {icon}
      </span>
      <span
        className={`text-[10px] font-medium ${
          active ? "text-emerald-500" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
