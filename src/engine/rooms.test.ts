import { describe, it, expect } from 'vitest';
import { rooms } from './rooms';

describe('rooms data', () => {
  it('should have at least one room', () => {
    expect(rooms.length).toBeGreaterThan(0);
  });
  it('first room should have a description', () => {
    expect(rooms[0].description).toBeTruthy();
  });
});
