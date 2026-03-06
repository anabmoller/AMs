// ============================================================
// SIGAM — Approval Engine (Edge Function)
// Server-side approval step calculation — never trust client.
//
// PR-2: Reads config from approval_config table + DB columns.
// Hardcoded values kept as fallbacks for safety.
// ============================================================

// ---- HARDCODED FALLBACKS (used only if DB lookup fails) ----
// These are kept for backward compatibility and safety net.
const FALLBACK_ESTABLISHMENT_COMPANY: Record<string, string> = {
  "Ypoti": "Rural Bioenergia S.A.",
  "Cerro Memby": "Chacobras S.A.",
  "Ybypora": "Rural Bioenergia S.A.",
  "Cielo Azul": "Rural Bioenergia S.A.",
  "Santa Clara": "Rural Bioenergia S.A.",
  "Yby Pyta": "Rural Bioenergia S.A.",
  "Lusipar": "Rural Bioenergia S.A.",
  "Santa Maria": "Rural Bioenergia S.A.",
  "Oro Verde": "Rural Bioenergia S.A.",
  "General": "Rural Bioenergia S.A.",
};

const FALLBACK_MANAGER_BY_ESTABLISHMENT: Record<string, string> = {
  "Ypoti": "paulo", "Cerro Memby": "fabiano", "Ybypora": "fabiano",
  "Cielo Azul": "pedro", "Santa Clara": "fabiano", "Yby Pyta": "fabiano",
  "Lusipar": "fabiano", "Santa Maria": "pedro", "Oro Verde": "paulo",
  "General": "ronei",
};

const FALLBACK_DIRECTOR_BY_COMPANY: Record<string, string> = {
  "Rural Bioenergia S.A.": "ronei", "Chacobras S.A.": "ronei",
  "La Constancia": "ana.karina", "Control Pasto S.A.": "ana",
  "Ana Moller": "ana.moller", "Gabriel Moller": "gabriel",
  "Pedro Moller": "pedro.moller",
};

const FALLBACK_PRESIDENT_BY_COMPANY: Record<string, string> = {
  "Rural Bioenergia S.A.": "mauricio", "Chacobras S.A.": "ana.karina",
  "La Constancia": "ana.karina", "Control Pasto S.A.": "ronei",
};

const FALLBACK_SUPER_APPROVERS: Record<string, number> = {
  "mauricio": Infinity,
  "ronei": 100_000_000_000,
};

// ---- Step Status & Types ----
export const STEP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION: "revision",
  SKIPPED: "skipped",
};

export const STEP_TYPES = {
  MANAGER: "manager",
  DIRECTOR: "director",
  OVERBUDGET: "overbudget",
  VET: "vet_specialist",
};

// ---- Types ----
export interface ApprovalStep {
  type: string;
  label: string;
  approverUsername: string;
  approverName: string;
  sla: number;
  conditional: boolean;
  status: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface PurchaseRequest {
  establishment: string;
  totalAmount: number;
  urgency: string;
  sector: string;
  company: string | null;
  budgetExceeded: boolean;
}

interface User {
  email: string;  // actually "username" in profiles
  name: string;
}

/** DB-driven config loaded by the Edge Function from approval_config table */
export interface ApprovalConfig {
  thresholds: {
    directorRequired: number;
    presidentRequired: number;
  };
  sla: {
    managerNormal: number;
    managerEmergency: number;
    directorNormal: number;
    directorEmergency: number;
    overbudget: number;
  };
  specialApprovers: {
    vetApprover: string;
    vetApprover2: string;
    overbudgetApprover: string;
  };
  vetSectors: string[];
  superApprovers: Record<string, number>;
}

export interface DynamicParams {
  establishments?: Array<{ name: string; company?: string; manager?: string }>;
  companies?: Array<{ name: string; director?: string; president?: string }>;
  config?: ApprovalConfig;
}

/** Build default config (hardcoded fallbacks) */
export function getDefaultConfig(): ApprovalConfig {
  return {
    thresholds: {
      directorRequired: 5_000_000,
      presidentRequired: 50_000_000,
    },
    sla: {
      managerNormal: 24,
      managerEmergency: 4,
      directorNormal: 48,
      directorEmergency: 8,
      overbudget: 48,
    },
    specialApprovers: {
      vetApprover: "rodrigo.ferreira",
      vetApprover2: "paulo",
      overbudgetApprover: "mauricio",
    },
    vetSectors: ["Veterinária", "Farmacia", "Veterinaria"],
    superApprovers: { ...FALLBACK_SUPER_APPROVERS },
  };
}

/** Parse approval_config rows into typed ApprovalConfig */
export function parseApprovalConfigRows(
  rows: Array<{ category: string; key: string; value: string }>,
): ApprovalConfig {
  const defaults = getDefaultConfig();

  for (const row of rows) {
    switch (row.category) {
      case "threshold":
        if (row.key === "director_required")
          defaults.thresholds.directorRequired = Number(row.value) || defaults.thresholds.directorRequired;
        if (row.key === "president_required")
          defaults.thresholds.presidentRequired = Number(row.value) || defaults.thresholds.presidentRequired;
        break;
      case "sla":
        if (row.key === "manager_normal") defaults.sla.managerNormal = Number(row.value) || defaults.sla.managerNormal;
        if (row.key === "manager_emergency") defaults.sla.managerEmergency = Number(row.value) || defaults.sla.managerEmergency;
        if (row.key === "director_normal") defaults.sla.directorNormal = Number(row.value) || defaults.sla.directorNormal;
        if (row.key === "director_emergency") defaults.sla.directorEmergency = Number(row.value) || defaults.sla.directorEmergency;
        if (row.key === "overbudget") defaults.sla.overbudget = Number(row.value) || defaults.sla.overbudget;
        break;
      case "special_approver":
        if (row.key === "vet_approver") defaults.specialApprovers.vetApprover = row.value;
        if (row.key === "vet_approver_2") defaults.specialApprovers.vetApprover2 = row.value;
        if (row.key === "overbudget_approver") defaults.specialApprovers.overbudgetApprover = row.value;
        break;
      case "vet_sectors":
        if (row.key === "list") defaults.vetSectors = row.value.split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "super_approver":
        defaults.superApprovers[row.key] =
          row.value === "Infinity" ? Infinity : (Number(row.value) || 0);
        break;
    }
  }

  return defaults;
}

/** Check if a user can approve a specific step (including super-approver powers) */
export function canUserApproveStep(
  username: string,
  step: { approverUsername: string },
  requestAmount = 0,
  superApprovers?: Record<string, number>,
): boolean {
  if (!username || !step) return false;
  if (username === step.approverUsername) return true;
  const supers = superApprovers || FALLBACK_SUPER_APPROVERS;
  const superLimit = supers[username];
  if (superLimit !== undefined && requestAmount <= superLimit) return true;
  return false;
}

// ============================================================
// APPROVAL ENGINE — Determines steps for a given PR
// ============================================================

export function calculateApprovalSteps(
  pr: PurchaseRequest,
  users: User[],
  dynamicParams?: DynamicParams,
): ApprovalStep[] {
  const steps: ApprovalStep[] = [];
  const resolveUser = (username: string) =>
    users.find((u) => u.email === username);

  // Load config — DB values or fallbacks
  const config = dynamicParams?.config || getDefaultConfig();

  // Dynamic resolution from admin parameters (with hardcoded fallback)
  const paramEstab = dynamicParams?.establishments?.find(
    (e) => e.name === pr.establishment,
  );
  const estabCompanyName =
    paramEstab?.company ||
    FALLBACK_ESTABLISHMENT_COMPANY[pr.establishment] ||
    "Rural Bioenergia S.A.";

  const paramCompany = dynamicParams?.companies?.find(
    (c) => c.name === estabCompanyName,
  );

  const isEmergency = pr.urgency === "emergencia";
  const amount = pr.totalAmount || 0;
  const isVetSector = config.vetSectors.includes(pr.sector);

  // ---- R5: Veterinaria/Farmacia → specialist first, then gerente confirmation ----
  if (isVetSector) {
    const vetUsername = config.specialApprovers.vetApprover;
    const vetUser = resolveUser(vetUsername);
    steps.push({
      type: STEP_TYPES.VET,
      label: "Especialista Veterinario",
      approverUsername: vetUsername,
      approverName: vetUser?.name || "Rodrigo Ferreira",
      sla: isEmergency ? config.sla.managerEmergency : config.sla.managerNormal,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
    const vet2Username = config.specialApprovers.vetApprover2;
    const vet2User = resolveUser(vet2Username);
    steps.push({
      type: STEP_TYPES.VET,
      label: "Confirmación Vet — Gerente",
      approverUsername: vet2Username,
      approverName: vet2User?.name || "Paulo Becker",
      sla: isEmergency ? config.sla.managerEmergency : config.sla.managerNormal,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  // ---- R1/R4: Gerente de Area — AUTORIZACIÓN (always present) ----
  const dynamicManager = paramEstab?.manager?.toLowerCase();
  const managerUsername =
    dynamicManager ||
    FALLBACK_MANAGER_BY_ESTABLISHMENT[pr.establishment] ||
    "ronei";
  const managerUser = resolveUser(managerUsername);
  steps.push({
    type: STEP_TYPES.MANAGER,
    label: "Autorización — Gerente de Área",
    approverUsername: managerUsername,
    approverName: managerUser?.name || managerUsername,
    sla: isEmergency ? config.sla.managerEmergency : config.sla.managerNormal,
    conditional: false,
    status: STEP_STATUS.PENDING,
    approvedAt: null,
    approvedBy: null,
  });

  // ---- R2: Director if amount >= threshold ----
  if (amount >= config.thresholds.directorRequired) {
    const dynamicDirector = paramCompany?.director?.toLowerCase();
    const directorUsername =
      dynamicDirector ||
      FALLBACK_DIRECTOR_BY_COMPANY[estabCompanyName] ||
      "ronei";
    const directorUser = resolveUser(directorUsername);
    steps.push({
      type: STEP_TYPES.DIRECTOR,
      label: "Aprobación — Director",
      approverUsername: directorUsername,
      approverName: directorUser?.name || directorUsername,
      sla: isEmergency ? config.sla.directorEmergency : config.sla.directorNormal,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  // ---- R3: Presidente if amount >= president threshold ----
  if (amount >= config.thresholds.presidentRequired) {
    const dynamicPresident = paramCompany?.president?.toLowerCase();
    const presidentUsername =
      dynamicPresident ||
      FALLBACK_PRESIDENT_BY_COMPANY[estabCompanyName];
    if (presidentUsername) {
      const presUser = resolveUser(presidentUsername);
      steps.push({
        type: STEP_TYPES.OVERBUDGET,
        label: "Aprobación — Presidente",
        approverUsername: presidentUsername,
        approverName: presUser?.name || presidentUsername,
        sla: config.sla.overbudget,
        conditional: false,
        status: STEP_STATUS.PENDING,
        approvedAt: null,
        approvedBy: null,
      });
    }
  }

  // ---- R6: Budget exceeded (below president threshold) → extra overbudget step ----
  if (pr.budgetExceeded && amount < config.thresholds.presidentRequired) {
    const obUsername = config.specialApprovers.overbudgetApprover;
    const obUser = resolveUser(obUsername);
    steps.push({
      type: STEP_TYPES.OVERBUDGET,
      label: "Aprobación Overbudget",
      approverUsername: obUsername,
      approverName: obUser?.name || "Mauricio",
      sla: config.sla.overbudget,
      conditional: true,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  return steps;
}

/** Get the current pending step (first non-approved step) */
export function getCurrentStep(
  steps: Array<{ status: string }>,
): (typeof steps)[number] | null {
  if (!steps || steps.length === 0) return null;
  return steps.find((s) => s.status === STEP_STATUS.PENDING) || null;
}

/** Check if all steps are approved */
export function isFullyApproved(
  steps: Array<{ status: string }>,
): boolean {
  if (!steps || steps.length === 0) return false;
  return steps.every(
    (s) =>
      s.status === STEP_STATUS.APPROVED || s.status === STEP_STATUS.SKIPPED,
  );
}
