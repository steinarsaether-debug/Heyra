import { describe, expect, it } from "vitest";
import { ServiceCategory } from "@prisma/client";
import { serviceListingSchema, serviceProviderProfileSchema } from "./service-schema";

describe("serviceProviderProfileSchema", () => {
  it("accepts a realistic provider profile", () => {
    const result = serviceProviderProfileSchema.parse({
      businessName: "Fjell og Fjord Service",
      publicContactName: "Nora Guide",
      phone: "+47 900 00 000",
      email: "nora@example.no",
      website: "https://example.no",
      municipality: "Voss",
      county: "Vestland",
      latitude: 60.63,
      longitude: 6.42,
      yearsExperience: 12,
      description: "We help visiting hunters and fishers with transport, gear handling, and practical local coordination.",
      qualifications: {
        licenseSummary: "Local approvals and trained dogs for recovery work.",
        equipmentSummary: "",
        transportCoverage: "",
        accommodationDetails: "",
      },
    });

    expect(result.businessName).toBe("Fjell og Fjord Service");
  });
});

describe("serviceListingSchema", () => {
  it("requires a usable public service description", () => {
    expect(() =>
      serviceListingSchema.parse({
        category: ServiceCategory.DOG_HANDLER,
        title: "Dog handler for recovery",
        description:
          "Practical dog-handler support for recovery work, coordination with landowners, and quick arrival in the local valley.",
        municipality: "Voss",
        county: "Vestland",
        latitude: 60.63,
        longitude: 6.42,
        priceFromNok: 2500,
        qualifications: {
          licenseSummary: "",
          equipmentSummary: "Vehicle and trained dog available.",
          transportCoverage: "",
          accommodationDetails: "",
        },
      }),
    ).not.toThrow();
  });
});
