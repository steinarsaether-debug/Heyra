import { describe, expect, it } from "vitest";
import { ComplianceTaskType, Species } from "@prisma/client";
import {
  buildHjorteviltregisteretDeepLink,
  getComplianceTaskNextStep,
  getComplianceTaskWhy,
  getCwdContactSummary,
  includesBigGameSpecies,
  requiresNationalFishingFee,
} from "./compliance";

describe("compliance helpers", () => {
  it("detects big-game species", () => {
    expect(includesBigGameSpecies([Species.ELG])).toBe(true);
    expect(includesBigGameSpecies([Species.OERRET, Species.ABBOR])).toBe(false);
  });

  it("detects fishing fee requirements from species and rules", () => {
    expect(
      requiresNationalFishingFee({
        species: [Species.LAKS],
        rules: null,
      }),
    ).toBe(true);

    expect(
      requiresNationalFishingFee({
        species: [Species.OERRET],
        rules: { requiresNationalFishingLicense: true },
      }),
    ).toBe(true);

    expect(
      requiresNationalFishingFee({
        species: [Species.OERRET],
        rules: null,
      }),
    ).toBe(false);
  });

  it("builds a Hjorteviltregisteret link with useful context", () => {
    const url = buildHjorteviltregisteretDeepLink({
      bookingId: "booking_123",
      species: [Species.ELG, Species.HJORT],
      municipality: "Trysil",
      county: "Innlandet",
      valdName: "Trysil storvald",
    });

    expect(url).toContain("hjorteviltregisteret.no");
    expect(url).toContain("booking=booking_123");
    expect(url).toContain("municipality=Trysil");
    expect(url).toContain("county=Innlandet");
    expect(url).toContain("species=ELG%2CHJORT");
    expect(url).toContain("vald=Trysil+storvald");
  });

  it("formats cwd contact details into practical task notes", () => {
    const lines = getCwdContactSummary({
      name: "Nordfjella zone 1",
      contactName: "Mattilsynet vakt",
      contactPhone: "22 40 00 00",
      contactEmail: "post@mattilsynet.no",
      contactWebsite: "https://www.mattilsynet.no",
      samplingInstructions: "Bring sample bags and report the tag number.",
      metadata: null,
    });

    expect(lines.join(" ")).toContain("Zone: Nordfjella zone 1.");
    expect(lines.join(" ")).toContain("Contact: Mattilsynet vakt.");
    expect(lines.join(" ")).toContain("Phone: 22 40 00 00.");
    expect(lines.join(" ")).toContain("Website: https://www.mattilsynet.no.");
  });

  it("exposes explainers for compliance tasks", () => {
    expect(getComplianceTaskWhy(ComplianceTaskType.CWD_GUIDANCE)).toContain("CWD-sone");
    expect(getComplianceTaskNextStep(ComplianceTaskType.SALMON_REPORTING)).toContain(
      "hvem som rapporterer fangst",
    );
  });
});
