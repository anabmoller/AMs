/**
 * requestTypes.js — Purchase-request category definitions for SIGAM
 *
 * Each request type maps to a module and determines which catalog
 * categories are pre-filtered in the request form.
 */

import {
  ShoppingCart,
  Fuel,
  Package,
} from "lucide-react";
import { BullIcon, CornIcon } from "../components/icons";
import { ROLES } from "./users";

/* ------------------------------------------------------------------ */
/*  Request type definitions                                           */
/* ------------------------------------------------------------------ */

export const REQUEST_TYPES = [
  {
    key: "general",
    label: "Compra General",
    description: "Solicitud de compra estándar",
    icon: ShoppingCart,
    module: "compras",
    permission: "create_request",
    categories: null, // all categories
  },
  {
    key: "ganado",
    label: "Hacienda",
    description: "Compras de ganado y productos veterinarios",
    icon: BullIcon,
    module: "ganado",
    permission: "view_ganado",
    categories: ["Hacienda", "Veterinaria"],
  },
  {
    key: "materia_prima",
    label: "Materia Prima",
    description: "Compras de insumos agrícolas y materia prima",
    icon: CornIcon,
    module: "materia_prima",
    permission: "view_inventory",
    categories: ["Materia Prima"],
  },
  {
    key: "combustible",
    label: "Combustible",
    description: "Solicitudes de abastecimiento de combustible",
    icon: Fuel,
    module: "combustible",
    permission: "view_inventory",
    categories: ["Combustible"],
  },
  {
    key: "inventario",
    label: "Inventario / Equipos",
    description: "Compras de equipos y materiales de depósito",
    icon: Package,
    module: "inventario",
    permission: "view_inventory",
    categories: ["Equipos"],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Return request types the given user is allowed to create, based on
 * their role permissions.
 */
export function getAvailableRequestTypes(user) {
  if (!user) return [];

  const role = user.role || "solicitante";

  // Super admins see all types
  if (["admin", "presidente"].includes(role)) {
    return REQUEST_TYPES;
  }

  const roleDef = ROLES[role];
  if (!roleDef) return [REQUEST_TYPES[0]]; // fallback to general

  return REQUEST_TYPES.filter((rt) => {
    if (!rt.permission) return true;
    return roleDef.permissions?.includes(rt.permission) ?? false;
  });
}
