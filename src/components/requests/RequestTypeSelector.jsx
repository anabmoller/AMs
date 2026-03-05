/**
 * RequestTypeSelector.jsx — Modal overlay for choosing a purchase request type.
 *
 * Props:
 *   types   – array of request-type objects (from getAvailableRequestTypes)
 *   onSelect(type) – called when user picks a type
 *   onClose        – called when user dismisses the modal
 */

import { X } from "lucide-react";

export default function RequestTypeSelector({ types = [], onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#111827] border border-white/10 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">
            Tipo de Solicitud
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type grid */}
        <div className="grid gap-3">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                onClick={() => onSelect(type)}
                className="flex items-center gap-4 w-full p-4 rounded-xl
                  bg-white/5 border border-white/10 hover:bg-white/10
                  hover:border-[#C8A03A]/40 transition-all text-left group"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 text-[#C8A03A] group-hover:bg-[#C8A03A]/20 transition-colors">
                  {Icon && typeof Icon === "function" ? (
                    <Icon size={20} />
                  ) : (
                    <span className="text-lg">{Icon}</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {type.label}
                  </p>
                  {type.description && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {type.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {types.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No hay tipos de solicitud disponibles para su rol.
          </p>
        )}
      </div>
    </div>
  );
}
