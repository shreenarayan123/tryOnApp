export const GARMENT_TYPES = [
  'lehenga',
  'saree',
  'kurta',
  'anarkali',
  'sharara',
  'salwar_suit',
  'western_top',
  'western_dress',
  'other',
] as const;

export type GarmentType = (typeof GARMENT_TYPES)[number];

export interface PhotoValidationResult {
  valid: boolean;
  reason?: string;
  issues: Array<'half_body' | 'blurry' | 'bad_lighting' | 'no_person' | 'multiple_persons'>;
  poseWarning: boolean;
  poseMessage: string;
  code?: string;
}

export interface GarmentDetectionResult {
  type: GarmentType;
  description: string;
}
