/**
 * PermissionsScreen.jsx — Role & module permissions management
 *
 * Displays the current role-permission matrix and allows admins
 * to visualize which roles can access which modules.
 */

import { useState, useMemo } from "react";
import { ROLES } from "../../constants/users";
import { useAuth } from "../../context/AuthContext";
import BackButton from "../common/BackButton";
import { Shield, Check, X, ChevronDown, ChevronUp } from "lucide-react";

const MODULE_LABELS = {
  create_request: "Crear Solicitudes",
  view_all_requests: "Ver Todas las Solicitudes",
  approve_manager: "Aprobar (Gerente)",
  approve_purchase: "Aprobar Compras",
  manage_quotations: "Gestionar Cotizaciones",
  advance_status: "Avanzar Estado",
  view_analytics: "Ver Análisis",
  view_inventory: "Ver Inventario",
  manage_settings: "Gestionar Configuración",
  manage_users: "Gestionar Usuarios",
  view_ganado: "Ver Hacienda",
  create_movimiento_ganado: "Crear Movimiento Ganado",
  validate_movimiento_ganado: "Validar Movimiento Ganado",
};

export default function PermissionsScreen({ onBack }) {
  const { can } = useAuth();
  const [expandedRole, setExpandedRole] = useState(null);

  const roles = useMemo(() => Object.values(ROLES), []);
  const allPermissions = useMemo(() => {
    const perms = new Set();
    roles.forEach((r) => r.permissions?.forEach((p) => perms.add(p)));
    return [...perms].sort();
  }, [roles]);

  if (!can("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-4 opacity-30" />
        <p>No tiene permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-bold text-white">Permisos por Rol</h1>
      </div>

      <p className="text-gray-400 text-sm">
        Matriz de permisos del sistema. Cada rol tiene un conjunto de permisos
        predefinidos que determinan el acceso a los módulos.
      </p>

      {/* Mobile: accordion view */}
      <div className="md:hidden space-y-2">
        {roles.map((role) => (
          <div
            key={role.key}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedRole(expandedRole === role.key ? null : role.key)
              }
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <p className="text-white text-sm font-medium">{role.label}</p>
                  <p className="text-gray-500 text-xs">{role.description}</p>
                </div>
              </div>
              {expandedRole === role.key ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>
            {expandedRole === role.key && (
              <div className="px-4 pb-4 space-y-1">
                {allPermissions.map((perm) => {
                  const has = role.permissions?.includes(perm);
                  return (
                    <div
                      key={perm}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-xs">
                        {MODULE_LABELS[perm] || perm}
                      </span>
                      {has ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left p-3 text-gray-400 font-medium">
                Permiso
              </th>
              {roles.map((role) => (
                <th
                  key={role.key}
                  className="p-3 text-center font-medium"
                  style={{ color: role.color }}
                >
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map((perm, i) => (
              <tr
                key={perm}
                className={i % 2 === 0 ? "bg-white/[0.02]" : ""}
              >
                <td className="p-3 text-gray-300">
                  {MODULE_LABELS[perm] || perm}
                </td>
                {roles.map((role) => (
                  <td key={role.key} className="p-3 text-center">
                    {role.permissions?.includes(perm) ? (
                      <Check
                        size={16}
                        className="inline-block text-emerald-400"
                      />
                    ) : (
                      <X size={16} className="inline-block text-gray-600" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
