# Testing Plan

## Current Status (Session 3)

**Test Summary:**
- ✅ 14 tests passing across 5 test files
- ✅ Vitest + React Testing Library configured
- ✅ Test infrastructure ready (runs in <2s)
- ⚠️ Coverage severely limited to ~5% of codebase

**Tested:**
- `parser.test.ts`: 7 tests (only `parseLook` and `parseMovement`)
- `rooms.test.ts`: 2 basic tests (room existence validation)
- `components/*.test.tsx`: 5 tests (basic render/interaction checks)

---

## Critical Gaps & Risk Assessment

### 🔴 PRIORITY 1: Parser Module (87.5% Untested)
**Estimated Effort:** 3-4 hours

**Untested Functions (14/16):**
- parseExamine
- parseGet / parseDrop
- parseOpen / parseClose
- parsePut
- parseSave / parseLoad / parseClear
- parseDebug / parseDebugTeleport
- parseTurn / parsePush / parsePull

**Risk Level:** MEDIUM
- Natural language parsing is bug-prone
- Easy to break with small changes
- Edge cases hide in multi-word targets, synonyms, special syntax

**Test Strategy:**
- Expand `parser.test.ts` with comprehensive coverage for each function
- Test valid inputs (exact, synonyms, multi-word)
- Test invalid inputs (wrong verb, incomplete syntax)
- Test special cases (containers, "from" syntax, "pick up" two-word verb)

**Example Test Cases:**
```typescript
describe('parseExamine', () => {
  it('parses exact examine commands', () => {
    expect(parseExamine('examine knife')).toEqual({ type: 'examine', target: 'knife' });
    expect(parseExamine('study ancient rune')).toEqual({ type: 'examine', target: 'ancient rune' });
    expect(parseExamine('inspect')).toBeNull(); // Missing target
  });
  // ... edge cases for all examine synonyms
});

describe('parseGet', () => {
  it('parses standard get commands', () => {
    expect(parseGet('get knife')).toEqual({ type: 'get', target: 'knife' });
    expect(parseGet('pick up sword')).toEqual({ type: 'get', target: 'sword' });
  });
  it('parses "from container" syntax', () => {
    expect(parseGet('get arrow from quiver')).toEqual({ type: 'get', target: 'arrow' });
    expect(parseGet('take scroll from chest')).toEqual({ type: 'get', target: 'scroll' });
  });
  // ... more cases
});
```

---

### 🔴 PRIORITY 2: Game Logic (App.tsx - 1,373 lines, 0% Tested)
**Estimated Effort:** 8-12 hours

**Critical Systems Not Tested:**
- Movement command handler (validation, exit visibility, direction priority)
- Look/examine commands (item/NPC lookup, descriptions, fallbacks)
- Inventory operations (take, drop, open, close, put)
- Puzzle interaction (turn/push/pull, state tracking, exit reveals)
- NPC visibility triggers (onDoorClosed/onDoorOpened)
- Exit visibility filtering (`isExitVisible` helper)
- Direction priority logic (single-letter abbreviations)

**Risk Level:** 🔴 CRITICAL
- Core game mechanics depend on this file
- Complex state management and interdependencies
- Session 3 added NPC/puzzle logic with no tests

**Test Strategy:**
- Create `App.test.tsx` with integration-style tests
- Test each command handler with valid/invalid inputs
- Test state changes (inventory, puzzle state, NPC visibility)
- Test edge cases (blocked exits, hidden rooms, visibility changes)

**High-Risk Test Cases:**
```typescript
describe('App Movement', () => {
  it('allows movement to visible exits', () => {
    // Setup: player in room with south exit
    // Execute: handleCommand('south')
    // Assert: player location changed, UI updated
  });
  
  it('blocks movement to hidden/unrevealed exits', () => {
    // Setup: secret exit requires puzzle solve
    // Execute: handleCommand('south') before puzzle solved
    // Assert: "You can't go that way." message
  });

  it('direction abbreviations take priority over aliases', () => {
    // Setup: room with "shattered door" exit AND south exit
    // Execute: handleCommand('s')
    // Assert: moves south (not to shattered door alias)
  });
});

describe('App Puzzles', () => {
  it('turn/push/pull activities update puzzle state', () => {
    // Setup: unsolved puzzle with turnEffect
    // Execute: handleCommand('turn pots')
    // Assert: puzzle marked solved, exit revealed
  });

  it('prevents solving same puzzle twice', () => {
    // Setup: already solved puzzle
    // Execute: handleCommand('turn pots') again
    // Assert: "already solved" message, state unchanged
  });
});

describe('App NPC Visibility', () => {
  it('shows NPC when trigger condition met', () => {
    // Setup: crow_spirit with onDoorClosed trigger
    // Execute: handleCommand('close black_door')
    // Assert: NPC appears with appearMessage
  });

  it('hides NPC when trigger reversed', () => {
    // Setup: crow_spirit already visible
    // Execute: handleCommand('open black_door')
    // Assert: NPC disappears with disappearMessage
  });
});
```

---

### 🔴 PRIORITY 3: Save System (save.ts, 0% Tested)
**Estimated Effort:** 2 hours

**Untested:**
- Save/load to localStorage
- Slot management (3 slots)
- JSON serialization/deserialization
- Error handling (corrupted saves, missing slots)
- Backward compatibility (missing puzzleState/npcState)

**Risk Level:** 🔴 CRITICAL
- Silent data loss if save format breaks
- Player progress lost if deserialization fails

**Test Cases:**
```typescript
describe('Save System', () => {
  it('saves game state to slot', () => {
    const gameState = { /* ... */ };
    saveSystem.saveToSlot(1, gameState);
    expect(localStorage.getItem('textquest_save_slot_1')).toBeTruthy();
  });

  it('loads game state from slot', () => {
    const gameState = { /* ... */ };
    saveSystem.saveToSlot(1, gameState);
    const loaded = saveSystem.loadFromSlot(1);
    expect(loaded).toEqual(gameState);
  });

  it('handles missing slots', () => {
    expect(saveSystem.loadFromSlot(1)).toBeNull();
  });

  it('clears slot data', () => {
    saveSystem.saveToSlot(1, { /* ... */ });
    saveSystem.clearSlot(1);
    expect(saveSystem.loadFromSlot(1)).toBeNull();
  });

  it('handles corrupted save data', () => {
    localStorage.setItem('textquest_save_slot_1', 'corrupted json {');
    expect(saveSystem.loadFromSlot(1)).toBeNull();
  });
});
```

---

### 🔴 PRIORITY 4: Item System (items.ts, 0% Tested)
**Estimated Effort:** 2-3 hours

**Untested:**
- Item lookup by ID, name, alias, prefix
- Multi-tier descriptions (skill-based)
- Container operations (open, close, contents)
- Activity effects (turn/push/pull descriptions)

**Risk Level:** MEDIUM
- Item descriptions appear in game output
- Container logic affects puzzle interactions

**Test Cases:**
```typescript
describe('Items', () => {
  it('retrieves item by ID', () => {
    const item = itemsDatabase['massive_clay_pots'];
    expect(item.name).toBe('massive clay pots');
  });

  it('gets correct description tier by skill', () => {
    const item = itemsDatabase['massive_clay_pots'];
    expect(item.descriptions[0]).toBeTruthy(); // Examine skill 0
    expect(item.descriptions[1]).toBeTruthy(); // Examine skill 1
  });

  it('returns activity descriptions', () => {
    const item = itemsDatabase['massive_clay_pots'];
    expect(item.turnDescription).toBeTruthy();
    expect(item.turnEffect.puzzleId).toBe('potsPuzzle');
  });
});
```

---

### 🟡 PRIORITY 5: NPC System (npcs.ts, 0% Tested)
**Estimated Effort:** 2 hours

**Untested:**
- NPC lookup by ID, name, alias, prefix
- Visibility state management
- Trigger evaluation
- Message formatting

**Risk Level:** MEDIUM
- New system added in session 3 with no tests
- Visibility logic affects game output and player experience

**Test Cases:**
```typescript
describe('NPC System', () => {
  it('retrieves NPC by ID', () => {
    const npc = getNPCById('crow_spirit');
    expect(npc.name).toBe('Crow Spirit');
  });

  it('finds NPC by name or alias', () => {
    const found1 = findNPCByNameOrPrefix([npcsDatabase['crow_spirit']], 'crow');
    const found2 = findNPCByNameOrPrefix([npcsDatabase['crow_spirit']], 'spirit');
    expect(found1).toBeTruthy();
    expect(found2).toBeTruthy();
  });

  it('matches visibility triggers', () => {
    const npc = getNPCById('crow_spirit');
    expect(npc.triggers.onDoorClosed).toBe('black_door');
  });
});
```

---

### 🟡 PRIORITY 6: Player System (player.ts, 0% Tested)
**Estimated Effort:** 1.5 hours

**Untested:**
- Inventory management
- Skill progression
- State mutations

**Test Cases:**
```typescript
describe('Player', () => {
  it('creates player with default values', () => {
    const player = createPlayer('forest_clearing');
    expect(player.location).toBe('forest_clearing');
    expect(player.inventory).toEqual([]);
    expect(player.skills.examine).toBe(0);
  });

  it('checks inventory space', () => {
    const player = createPlayer('forest_clearing');
    expect(canAddToInventory(player, 1)).toBe(true);
    expect(canAddToInventory(player, 21)).toBe(false); // maxInventory = 20
  });

  it('increases skill level', () => {
    const player = createPlayer('forest_clearing');
    increaseSkill(player, 'examine', 1);
    expect(player.skills.examine).toBe(1);
    increaseSkill(player, 'examine', 5); // Try to exceed max 5
    expect(player.skills.examine).toBe(5); // Capped at 5
  });
});
```

---

### 🟡 PRIORITY 7: Components (AsciiMap, PlayerStats, others)
**Estimated Effort:** 4-6 hours

**Untested:**
- `AsciiMap.tsx`: Puzzle-aware rendering, reachability calculation
- `PlayerStats.tsx`: Stats display
- Component interactions and edge cases

**Test Cases:**
```typescript
describe('AsciiMap', () => {
  it('does not render hidden rooms from unsolved puzzles', () => {
    const puzzleState = { secret_chamber: { potsPuzzle: false } };
    render(<AsciiMap currentRoomId="chamber_of_runes" puzzleState={puzzleState} />);
    // Secret chamber should not be visible
    expect(screen.queryByText('secret chamber')).not.toBeInTheDocument();
  });

  it('renders hidden rooms after puzzle solved', () => {
    const puzzleState = { secret_chamber: { potsPuzzle: true } };
    render(<AsciiMap currentRoomId="chamber_of_runes" puzzleState={puzzleState} />);
    // Secret chamber should be visible
    expect(screen.getByText('secret chamber')).toBeInTheDocument();
  });
});
```

---

## Implementation Timeline

| Priority | Module | Effort | Target |
|----------|--------|--------|--------|
| 1 | Parser Functions | 3-4h | Session 4 |
| 2 | Game Logic (App.tsx) | 8-12h | Session 4-5 |
| 3 | Save System | 2h | Session 4 |
| 4 | Item System | 2-3h | Session 4 |
| 5 | NPC System | 2h | Session 4 |
| 6 | Player System | 1.5h | Session 4 |
| 7 | Components | 4-6h | Session 5 |
| **Total** | | **22-32 hours** | |

---

## Setup & Best Practices

**Tools Available:**
- ✅ Vitest configured
- ✅ React Testing Library ready
- ✅ jsdom environment for DOM testing
- ⚠️ No coverage reporting yet

**Recommended Additions:**
1. Add coverage reporting:
   ```json
   "test:coverage": "vitest --coverage"
   ```

2. Add test CI/CD:
   - Run tests before build
   - Run tests on PR
   - Report coverage metrics

3. Add test patterns:
   - Use `vi.fn()` for mock functions
   - Use `beforeEach` for setup, `afterEach` for cleanup
   - Keep test names descriptive

---

## Success Criteria

- ✅ Parser coverage > 90% (all functions tested)
- ✅ Game logic integration tests > 80% coverage
- ✅ Save/load system 100% coverage
- ✅ All critical system tests pass before build
- ✅ No regressions from Session 3 features

