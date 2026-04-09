import {
  ConfidenceLevel,
  PropertyStatus,
  SharedApprovalStatus,
  TerrainType,
  ValdVerificationMethod,
  type Property,
} from "@prisma/client";

type PropertyWithMinimalShape = Pick<
  Property,
  | "id"
  | "cadastralRef"
  | "municipality"
  | "county"
  | "areaHectares"
  | "terrainTypes"
  | "status"
  | "createdAt"
>;

type PropertyCompletionShape = PropertyWithMinimalShape & {
  boundary?: unknown | null;
  centerPoint?: unknown | null;
};

export function formatPropertyStatus(status: PropertyStatus) {
  switch (status) {
    case PropertyStatus.DRAFT:
      return "Utkast";
    case PropertyStatus.PENDING_REVIEW:
      return "Klar til gjennomgang";
    case PropertyStatus.ACTIVE:
      return "Aktiv";
    case PropertyStatus.SUSPENDED:
      return "Suspendert";
  }
}

export function formatTerrainTypes(terrainTypes: TerrainType[]) {
  if (terrainTypes.length === 0) {
    return "Ikke satt";
  }

  return terrainTypes
    .map((type) => {
      switch (type) {
        case TerrainType.FOREST:
          return "Skog";
        case TerrainType.MOUNTAIN:
          return "Fjell";
        case TerrainType.FJORD:
          return "Fjord";
        case TerrainType.WETLAND:
          return "Våtmark";
        case TerrainType.FARMLAND:
          return "Jordbruksland";
        case TerrainType.COASTAL:
          return "Kystterreng";
      }
    })
    .join(", ");
}

export function formatConfidenceLevel(level: ConfidenceLevel) {
  switch (level) {
    case ConfidenceLevel.LOW:
      return "Lav";
    case ConfidenceLevel.MEDIUM:
      return "Middels";
    case ConfidenceLevel.HIGH:
      return "Høy";
  }
}

export function formatValdVerificationMethod(method: ValdVerificationMethod) {
  switch (method) {
    case ValdVerificationMethod.SELF_DECLARED:
      return "Egenerklært";
    case ValdVerificationMethod.MUNICIPAL_REFERENCE:
      return "Kommunal referanse";
    case ValdVerificationMethod.MANUAL_REVIEW:
      return "Manuell gjennomgang";
    case ValdVerificationMethod.EXTERNAL_REGISTRY:
      return "Eksternt register";
  }
}

export function formatSharedApprovalStatus(status: SharedApprovalStatus) {
  switch (status) {
    case SharedApprovalStatus.NOT_REQUESTED:
      return "Ikke forespurt";
    case SharedApprovalStatus.PENDING:
      return "Avventer";
    case SharedApprovalStatus.CONFIRMED:
      return "Bekreftet";
  }
}

export function getPropertyCompletionState(property: PropertyCompletionShape) {
  const hasIdentity =
    Boolean(property.cadastralRef.trim()) &&
    Boolean(property.municipality.trim()) &&
    Boolean(property.county.trim()) &&
    property.areaHectares > 0;
  const hasTerrain = property.terrainTypes.length > 0;
  const hasBoundary = Boolean(property.boundary && property.centerPoint);

  const steps = [
    {
      key: "identity",
      label: "Grunnleggende eiendomsdata",
      complete: hasIdentity,
    },
    {
      key: "terrain",
      label: "Terreng og fasiliteter",
      complete: hasTerrain,
    },
    {
      key: "boundary",
      label: "Grense og kartflate",
      complete: hasBoundary,
    },
  ];

  const completed = steps.filter((step) => step.complete).length;

  return {
    steps,
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
    hasBoundary,
  };
}
