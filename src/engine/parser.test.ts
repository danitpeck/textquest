import { parseLook, parseMovement, parseExamine, parseGet, parseDrop } from './parser';
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

describe('parseExamine', () => {
  it('parses basic examine commands', () => {
    expect(parseExamine('examine knife')).toEqual({ type: 'examine', target: 'knife' });
    expect(parseExamine('study painting')).toEqual({ type: 'examine', target: 'painting' });
    expect(parseExamine('inspect door')).toEqual({ type: 'examine', target: 'door' });
  });
  
  it('parses examine with examine synonyms', () => {
    expect(parseExamine('ex scroll')).toEqual({ type: 'examine', target: 'scroll' });
    expect(parseExamine('exa chest')).toEqual({ type: 'examine', target: 'chest' });
    expect(parseExamine('exam artifact')).toEqual({ type: 'examine', target: 'artifact' });
    expect(parseExamine('investigate clue')).toEqual({ type: 'examine', target: 'clue' });
  });
  
  it('parses examine with multi-word targets', () => {
    expect(parseExamine('examine ancient rune')).toEqual({ type: 'examine', target: 'ancient rune' });
    expect(parseExamine('study copper knife')).toEqual({ type: 'examine', target: 'copper knife' });
    expect(parseExamine('inspect mysterious door')).toEqual({ type: 'examine', target: 'mysterious door' });
  });
  
  it('returns null for examine without target', () => {
    expect(parseExamine('examine')).toBeNull();
    expect(parseExamine('study')).toBeNull();
    expect(parseExamine('inspect')).toBeNull();
  });
  
  it('returns null for non-examine commands', () => {
    expect(parseExamine('look knife')).toBeNull();
    expect(parseExamine('get artifact')).toBeNull();
  });
});

describe('parseGet', () => {
  it('parses basic get commands', () => {
    expect(parseGet('get knife')).toEqual({ type: 'get', target: 'knife' });
    expect(parseGet('take scroll')).toEqual({ type: 'get', target: 'scroll' });
    expect(parseGet('grab potion')).toEqual({ type: 'get', target: 'potion' });
  });
  
  it('parses get with all synonyms', () => {
    expect(parseGet('get sword')).toEqual({ type: 'get', target: 'sword' });
    expect(parseGet('take amulet')).toEqual({ type: 'get', target: 'amulet' });
    expect(parseGet('grab ring')).toEqual({ type: 'get', target: 'ring' });
    expect(parseGet('pick coin')).toEqual({ type: 'get', target: 'coin' });
    expect(parseGet('acquire artifact')).toEqual({ type: 'get', target: 'artifact' });
    expect(parseGet('obtain treasure')).toEqual({ type: 'get', target: 'treasure' });
  });
  
  it('parses "pick up" two-word verb', () => {
    expect(parseGet('pick up sword')).toEqual({ type: 'get', target: 'sword' });
    expect(parseGet('pickup scroll')).toEqual({ type: 'get', target: 'scroll' });
  });
  
  it('parses get with multi-word targets', () => {
    expect(parseGet('get ancient scroll')).toEqual({ type: 'get', target: 'ancient scroll' });
    expect(parseGet('take copper knife')).toEqual({ type: 'get', target: 'copper knife' });
  });
  
  it('parses get from container syntax', () => {
    expect(parseGet('get knife from chest')).toEqual({ type: 'get', target: 'knife' });
    expect(parseGet('take scroll from table')).toEqual({ type: 'get', target: 'scroll' });
    expect(parseGet('grab coin from purse')).toEqual({ type: 'get', target: 'coin' });
  });
  
  it('parses get from container with multi-word item names', () => {
    expect(parseGet('get copper knife from wooden chest')).toEqual({ type: 'get', target: 'copper knife' });
    expect(parseGet('take ancient scroll from table')).toEqual({ type: 'get', target: 'ancient scroll' });
  });
  
  it('returns null for get without target', () => {
    expect(parseGet('get')).toBeNull();
    expect(parseGet('take')).toBeNull();
    expect(parseGet('pick up')).toBeNull();
  });
  
  it('returns null for non-get commands', () => {
    expect(parseGet('look knife')).toBeNull();
    expect(parseGet('drop sword')).toBeNull();
  });
});

describe('parseDrop', () => {
  it('parses basic drop commands', () => {
    expect(parseDrop('drop knife')).toEqual({ type: 'drop', target: 'knife' });
    expect(parseDrop('leave scroll')).toEqual({ type: 'drop', target: 'scroll' });
    expect(parseDrop('set potion')).toEqual({ type: 'drop', target: 'potion' });
    expect(parseDrop('place amulet')).toEqual({ type: 'drop', target: 'amulet' });
    expect(parseDrop('throw rock')).toEqual({ type: 'drop', target: 'rock' });
  });
  
  it('parses drop with multi-word targets', () => {
    expect(parseDrop('drop copper knife')).toEqual({ type: 'drop', target: 'copper knife' });
    expect(parseDrop('leave ancient scroll')).toEqual({ type: 'drop', target: 'ancient scroll' });
  });
  
  it('parses drop with "down" filler word', () => {
    expect(parseDrop('set down scroll')).toEqual({ type: 'drop', target: 'scroll' });
    expect(parseDrop('drop down ring')).toEqual({ type: 'drop', target: 'ring' });
    expect(parseDrop('leave down item')).toEqual({ type: 'drop', target: 'item' });
  });
  
  it('parses drop with "down" filler and multi-word targets', () => {
    expect(parseDrop('set down copper knife')).toEqual({ type: 'drop', target: 'copper knife' });
    expect(parseDrop('drop down ancient scroll')).toEqual({ type: 'drop', target: 'ancient scroll' });
  });
  
  it('returns null for drop without target', () => {
    expect(parseDrop('drop')).toBeNull();
    expect(parseDrop('leave')).toBeNull();
    expect(parseDrop('set down')).toBeNull();
  });
  
  it('returns null for non-drop commands', () => {
    expect(parseDrop('look knife')).toBeNull();
    expect(parseDrop('get sword')).toBeNull();
  });
});
