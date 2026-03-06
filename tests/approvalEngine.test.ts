// ============================================================
// Tests for the Approval Engine (pure logic)
//
// These tests import the TS source directly by aliasing out
// Deno-specific imports. The approval engine is pure logic —
// no network calls, no DB — so it's perfectly testable in Node.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  calculateApprovalSteps,
  getDefaultConfig,
  parseApprovalConfigRows,
  canUserApproveStep,
  getCurrentStep,
  isFullyApproved,
  STEP_STATUS,
  STEP_TYPES,
} from "../supabase/functions/_shared/approvalEngine.ts";

// Helper: minimal user list matching the engine's lookup
const USERS = [
  { email: "paulo", name: "Paulo Becker" },
  { email: "fabiano", name: "Fabiano" },
  { email: "pedro", name: "Pedro" },
  { email: "ronei", name: "Ronei" },
  { email: "mauricio", name: "Mauricio" },
  { email: "ana.karina", name: "Ana Karina" },
  { email: "rodrigo.ferreira", name: "Rodrigo Ferreira" },
];

describe("getDefaultConfig", () => {
  it("returns thresholds", () => {
    const config = getDefaultConfig();
    expect(config.thresholds.directorRequired).toBe(5_000_000);
    expect(config.thresholds.presidentRequired).toBe(50_000_000);
  });

  it("returns SLA values", () => {
    const config = getDefaultConfig();
    expect(config.sla.managerNormal).toBe(24);
    expect(config.sla.managerEmergency).toBe(4);
  });

  it("returns vet sectors", () => {
    const config = getDefaultConfig();
    expect(config.vetSectors).toContain("Veterinária");
    expect(config.vetSectors).toContain("Farmacia");
  });
});

describe("parseApprovalConfigRows", () => {
  it("overrides thresholds from DB rows", () => {
    const rows = [
      { category: "threshold", key: "director_required", value: "10000000" },
      { category: "threshold", key: "president_required", value: "99000000" },
    ];
    const config = parseApprovalConfigRows(rows);
    expect(config.thresholds.directorRequired).toBe(10_000_000);
    expect(config.thresholds.presidentRequired).toBe(99_000_000);
  });

  it("overrides SLA from DB rows", () => {
    const rows = [
      { category: "sla", key: "manager_normal", value: "12" },
    ];
    const config = parseApprovalConfigRows(rows);
    expect(config.sla.managerNormal).toBe(12);
    // Others unchanged
    expect(config.sla.directorNormal).toBe(48);
  });

  it("overrides special approvers", () => {
    const rows = [
      { category: "special_approver", key: "vet_approver", value: "dr.house" },
    ];
    const config = parseApprovalConfigRows(rows);
    expect(config.specialApprovers.vetApprover).toBe("dr.house");
  });

  it("parses vet sectors as comma-separated list", () => {
    const rows = [
      { category: "vet_sectors", key: "list", value: "A, B , C" },
    ];
    const config = parseApprovalConfigRows(rows);
    expect(config.vetSectors).toEqual(["A", "B", "C"]);
  });

  it("parses super-approvers including Infinity", () => {
    const rows = [
      { category: "super_approver", key: "boss", value: "Infinity" },
      { category: "super_approver", key: "mgr", value: "5000000" },
    ];
    const config = parseApprovalConfigRows(rows);
    expect(config.superApprovers["boss"]).toBe(Infinity);
    expect(config.superApprovers["mgr"]).toBe(5_000_000);
  });
});

describe("calculateApprovalSteps", () => {
  const basePR = {
    establishment: "Ypoti",
    totalAmount: 100_000,
    urgency: "media",
    sector: "General",
    company: null,
    budgetExceeded: false,
  };

  it("always includes manager step", () => {
    const steps = calculateApprovalSteps(basePR, USERS);
    const managerStep = steps.find((s) => s.type === STEP_TYPES.MANAGER);
    expect(managerStep).toBeDefined();
    expect(managerStep!.approverUsername).toBe("paulo"); // Ypoti → paulo
    expect(managerStep!.status).toBe(STEP_STATUS.PENDING);
  });

  it("does NOT include director for small amounts", () => {
    const steps = calculateApprovalSteps(basePR, USERS);
    const directorStep = steps.find((s) => s.type === STEP_TYPES.DIRECTOR);
    expect(directorStep).toBeUndefined();
  });

  it("includes director when amount >= 5M", () => {
    const pr = { ...basePR, totalAmount: 5_000_000 };
    const steps = calculateApprovalSteps(pr, USERS);
    const directorStep = steps.find((s) => s.type === STEP_TYPES.DIRECTOR);
    expect(directorStep).toBeDefined();
    expect(directorStep!.approverUsername).toBe("ronei");
  });

  it("includes president when amount >= 50M", () => {
    const pr = { ...basePR, totalAmount: 50_000_000 };
    const steps = calculateApprovalSteps(pr, USERS);
    const types = steps.map((s) => s.type);
    expect(types).toContain(STEP_TYPES.MANAGER);
    expect(types).toContain(STEP_TYPES.DIRECTOR);
    expect(types).toContain(STEP_TYPES.OVERBUDGET); // president step
  });

  it("uses emergency SLA when urgency = emergencia", () => {
    const pr = { ...basePR, urgency: "emergencia" };
    const steps = calculateApprovalSteps(pr, USERS);
    const managerStep = steps.find((s) => s.type === STEP_TYPES.MANAGER)!;
    expect(managerStep.sla).toBe(4); // emergency SLA
  });

  it("adds vet steps for Veterinária sector", () => {
    const pr = { ...basePR, sector: "Veterinária" };
    const steps = calculateApprovalSteps(pr, USERS);
    const vetSteps = steps.filter((s) => s.type === STEP_TYPES.VET);
    expect(vetSteps.length).toBe(2);
    expect(vetSteps[0].approverUsername).toBe("rodrigo.ferreira");
    expect(vetSteps[1].approverUsername).toBe("paulo");
  });

  it("adds overbudget step when budget exceeded (below president threshold)", () => {
    const pr = { ...basePR, totalAmount: 1_000_000, budgetExceeded: true };
    const steps = calculateApprovalSteps(pr, USERS);
    const obStep = steps.find(
      (s) => s.type === STEP_TYPES.OVERBUDGET && s.label === "Aprobación Overbudget",
    );
    expect(obStep).toBeDefined();
    expect(obStep!.approverUsername).toBe("mauricio");
    expect(obStep!.conditional).toBe(true);
  });

  it("does NOT add overbudget step when amount >= president threshold (president step already present)", () => {
    const pr = { ...basePR, totalAmount: 60_000_000, budgetExceeded: true };
    const steps = calculateApprovalSteps(pr, USERS);
    const obSteps = steps.filter(
      (s) => s.type === STEP_TYPES.OVERBUDGET && s.label === "Aprobación Overbudget",
    );
    expect(obSteps.length).toBe(0); // no extra overbudget — president step handles it
  });

  it("resolves establishment from dynamic params", () => {
    const dynamicParams = {
      establishments: [{ name: "Ypoti", company: "Rural Bioenergia S.A.", manager: "custom_mgr" }],
      companies: [{ name: "Rural Bioenergia S.A.", director: "custom_dir" }],
    };
    const pr = { ...basePR, totalAmount: 10_000_000 };
    const steps = calculateApprovalSteps(pr, USERS, dynamicParams);
    expect(steps.find((s) => s.type === STEP_TYPES.MANAGER)!.approverUsername).toBe("custom_mgr");
    expect(steps.find((s) => s.type === STEP_TYPES.DIRECTOR)!.approverUsername).toBe("custom_dir");
  });

  it("uses config from dynamic params", () => {
    const config = getDefaultConfig();
    config.thresholds.directorRequired = 999_999_999; // very high
    const pr = { ...basePR, totalAmount: 10_000_000 };
    const steps = calculateApprovalSteps(pr, USERS, { config });
    // Director should NOT appear because threshold is very high
    expect(steps.find((s) => s.type === STEP_TYPES.DIRECTOR)).toBeUndefined();
  });
});

describe("canUserApproveStep", () => {
  it("returns true for the assigned approver", () => {
    expect(
      canUserApproveStep("paulo", { approverUsername: "paulo" }),
    ).toBe(true);
  });

  it("returns false for a different user", () => {
    expect(
      canUserApproveStep("fabiano", { approverUsername: "paulo" }),
    ).toBe(false);
  });

  it("returns true for super-approver within limit", () => {
    expect(
      canUserApproveStep("mauricio", { approverUsername: "paulo" }, 1000),
    ).toBe(true);
  });

  it("returns true for super-approver with custom map", () => {
    const supers = { testuser: 5_000_000 };
    expect(
      canUserApproveStep("testuser", { approverUsername: "paulo" }, 1_000_000, supers),
    ).toBe(true);
  });

  it("returns false for super-approver over limit", () => {
    const supers = { testuser: 1_000 };
    expect(
      canUserApproveStep("testuser", { approverUsername: "paulo" }, 5_000, supers),
    ).toBe(false);
  });
});

describe("getCurrentStep / isFullyApproved", () => {
  it("returns first pending step", () => {
    const steps = [
      { status: STEP_STATUS.APPROVED },
      { status: STEP_STATUS.PENDING },
      { status: STEP_STATUS.PENDING },
    ];
    expect(getCurrentStep(steps)).toBe(steps[1]);
  });

  it("returns null when all approved", () => {
    const steps = [
      { status: STEP_STATUS.APPROVED },
      { status: STEP_STATUS.SKIPPED },
    ];
    expect(getCurrentStep(steps)).toBeNull();
  });

  it("isFullyApproved returns true when all approved/skipped", () => {
    expect(
      isFullyApproved([
        { status: STEP_STATUS.APPROVED },
        { status: STEP_STATUS.SKIPPED },
        { status: STEP_STATUS.APPROVED },
      ]),
    ).toBe(true);
  });

  it("isFullyApproved returns false when any pending", () => {
    expect(
      isFullyApproved([
        { status: STEP_STATUS.APPROVED },
        { status: STEP_STATUS.PENDING },
      ]),
    ).toBe(false);
  });
});
