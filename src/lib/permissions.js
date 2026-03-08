/**
 * permissions.js — Module-level access control for SIGAM
 *
 * Provides role-based module visibility and record-level filtering.
 * Works alongside the role/permission system in constants/users.js.
 */

import { ROLES } from "../constants/users";
import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Module definitions                                                 */
/* ------------------------------------------------------------------ */

const ALL_MODULES = [
  "compras",
  "inventario",
  "ganado",
  "combustible",
  "materia_prima",
  "analytics",
  "admin",
];

/**
 * Roles that count as "super admin" — full unrestricted access.
 */
const SUPER_ADMIN_ROLES = ["admin", "presidente", "superadmin"];

/* ------------------------------------------------------------------ */
/*  Initialisation (called once on app boot)                           */
/* ------------------------------------------------------------------ */

let _permissionsReady = false;

/**
 * Async bootstrap — currently a no-op placeholder for future
 * server-side permission fetching. Resolves immediately.
 */
export async function initPermissions(/* userId */) {
  _permissionsReady = true;
}

/* ------------------------------------------------------------------ */
/*  Core helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Is the user a super-admin (full access)?
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  const role = user.role || "solicitante";
  return SUPER_ADMIN_ROLES.includes(role);
}

/**
 * Can `user` access the given module?
 * Super-admins can access everything. Other roles need matching permissions.
 */
export function canAccessModule(user, moduleName) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const role = ROLES[user.role];
  if (!role) return false;

  // Map module names to permission keys
  const modulePermMap = {
    ganado: "view_ganado",
    inventario: "view_inventory",
    analytics: "view_analytics",
    admin: "manage_settings",
    compras: "create_request",
    combustible: "view_inventory",
    materia_prima: "view_inventory",
  };

  const requiredPerm = modulePermMap[moduleName];
  if (!requiredPerm) return true; // Unknown module → allow by default
  return role.permissions?.includes(requiredPerm) ?? false;
}

/**
 * Return the list of module keys the user is allowed to see.
 */
export function getAllowedModules(user) {
  if (!user) return [];
  if (isSuperAdmin(user)) return [...ALL_MODULES];
  return ALL_MODULES.filter((mod) => canAccessModule(user, mod));
}

/**
 * Build a Supabase-compatible filter object so that non-admins
 * only see their own records.
 *
 * Usage:  query = buildRecordsFilter(query, user);
 */
export function buildRecordsFilter(query, user) {
  if (!user) return query;
  if (isSuperAdmin(user)) return query; // no filter
  return query.eq("created_by", user.id);
}
