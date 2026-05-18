export const VALID_GARMENT_ISSUES = ['half_body', 'blurry', 'bad_lighting', 'no_person', 'multiple_persons'] as const;

export type ValidationIssue = (typeof VALID_GARMENT_ISSUES)[number];
