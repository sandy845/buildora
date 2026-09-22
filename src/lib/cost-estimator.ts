export type EstimateFormValues = {
  propertyType: string;
  constructionType: string;
  area: string;
  floors: string;
  interior: string;
  location: string;
  quality: string;
};

export type EstimateResult = {
  minimum: number;
  maximum: number;
  perSqFt: number;
};

const propertyMultipliers: Record<string, number> = {
  Apartment: 1,
  Villa: 1.18,
  Commercial: 1.3,
  Duplex: 1.24,
};

const constructionMultipliers: Record<string, number> = {
  RCC: 1.22,
  "Load bearing": 0.96,
  Mixed: 1.08,
};

const locationMultipliers: Record<string, number> = {
  Metro: 1.26,
  "Tier 1": 1.15,
  "Tier 2": 1.04,
  Rural: 0.92,
};

const interiorMultipliers: Record<string, number> = {
  Basic: 0.9,
  Standard: 1,
  Premium: 1.18,
  Luxury: 1.32,
};

const qualityMultipliers: Record<string, number> = {
  Standard: 1,
  Premium: 1.18,
  Luxury: 1.32,
};

function normalizeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateEstimate(values: EstimateFormValues): EstimateResult {
  const area = normalizeNumber(values.area);
  const floors = normalizeNumber(values.floors);

  const propertyFactor = propertyMultipliers[values.propertyType] ?? 1;
  const constructionFactor = constructionMultipliers[values.constructionType] ?? 1;
  const locationFactor = locationMultipliers[values.location] ?? 1;
  const interiorFactor = interiorMultipliers[values.interior] ?? 1;
  const qualityFactor = qualityMultipliers[values.quality] ?? 1;
  const floorFactor = 1 + Math.max(floors - 1, 0) * 0.07;

  const baseRate = 1450;
  const adjustedRate =
    baseRate *
    propertyFactor *
    constructionFactor *
    locationFactor *
    interiorFactor *
    qualityFactor *
    floorFactor;

  const minimum = area * adjustedRate * 0.9;
  const maximum = area * adjustedRate * 1.18;

  return {
    minimum,
    maximum,
    perSqFt: adjustedRate,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
