import { parseLook, parseMovement } from './parser';
import { describe, it, expect } from 'vitest';

describe('parseLook', () => {
  it('parses basic look commands', () => {
    expect(parseLook('look')).toEqual({ type: 'look' });
    expect(parseLook('l')).toEqual({ type: 'look' });
    expect(parseLook('loo')).toEqual({ type: 'look' });
  });
  it('parses look with direction', () => {
    expect(parseLook('look north')).toEqual({ type: 'look', target: 'north' });
    expect(parseLook('look n')).toEqual({ type: 'look', target: 'north' });
    expect(parseLook('look east')).toEqual({ type: 'look', target: 'east' });
  });
  it('parses look at sky', () => {
    expect(parseLook('look sky')).toEqual({ type: 'look', target: 'sky' });
  });
  it('returns null for non-look commands', () => {
    expect(parseLook('examine')).toBeNull();
    expect(parseLook('see')).toBeNull();
  });
});

describe('parseMovement', () => {
  it('parses single direction', () => {
    expect(parseMovement('north')).toBe('north');
    expect(parseMovement('n')).toBe('north');
    expect(parseMovement('down')).toBe('down');
  });
  it('parses movement verbs with direction', () => {
    expect(parseMovement('go north')).toBe('north');
    expect(parseMovement('walk east')).toBe('east');
    expect(parseMovement('run up')).toBe('up');
    expect(parseMovement('move d')).toBe('down');
  });
  it('returns null for invalid movement', () => {
    expect(parseMovement('jump')).toBeNull();
    expect(parseMovement('fly westward')).toBeNull();
  });
});
