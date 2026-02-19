// List of canonical compass directions for the compass UI
export const COMPASS_DIRECTIONS = [
  'n', 's', 'e', 'w', 'u', 'd'
] as const;

export type CompassDirection = typeof COMPASS_DIRECTIONS[number];
