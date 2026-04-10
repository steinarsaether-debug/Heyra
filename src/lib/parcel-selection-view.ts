type ParcelSelectionSummaryInput = {
  totalCount: number;
  includedCount: number;
  nearbyCount?: number;
};

export function formatParcelSelectionSummary(input: ParcelSelectionSummaryInput) {
  const parts: string[] = [];

  parts.push(
    `${input.totalCount} teig${input.totalCount === 1 ? "" : "er"} lagret fra samme eiendom`,
  );
  parts.push(
    `${input.includedCount} markert for jaktterreng${input.includedCount === 1 ? "" : ""}`,
  );

  if ((input.nearbyCount ?? 0) > 0) {
    parts.push(
      `${input.nearbyCount} naboteig${input.nearbyCount === 1 ? "" : "er"} lagret som oversikt`,
    );
  }

  return parts.join(" · ");
}
