# Development Plan

## Milestones

### 1. **Core Engine & Parser** ✅ COMPLETE
   - ✅ Text parser: look, get/take, drop, examine, open/close, movement
   - ✅ Fuzzy/prefix item matching & natural language synonyms
   - ✅ Room and object system with arbitrary exit names
   - ✅ Inventory system (20-slot max)
   - ✅ Door system with persistent state and movement blocking
   - ✅ Multi-word command support (put down, set down)
   - ✅ **Containers**: Items with contents, open/close, take/put items from/to containers
   - ✅ Examine abbreviations (exa, exam, exami, ex, x)
   - ✅ Look in container syntax (e.g., "look in chest")
   - ✅ Smart container descriptions on look command

### 2. **Save/Load System** ✅ COMPLETE
   - ✅ 3-slot save system with localStorage
   - ✅ Persists: location, inventory, skills, item/door state, containers
   - ✅ Save/Load buttons in UI with modal menu
   - ✅ Load menu modal with room names, timestamps, and delete buttons
   - ✅ Commands: save, save 1/2/3, load, load 1/2/3, clear, clear 1/2/3
   - ✅ New game starts from empty slot
   - ✅ Auto-slot persistence (saves to last-used slot)
   - ✅ Default slot (Slot 1)

### 3. **World Expansion**
   - 📦 Expand rooms from 9 to 20+ with story locations
   - 📦 NPC data structure design
   - 📦 Conversation/dialogue tree system

### 4. **Alchemy System**
   - 📦 Recipe data structure and storage
   - 📦 Recipe discovery/learning mechanics
   - 📦 Crafting UI and item combination

### 5. **Potion Effects**
   - 📦 Effect trigger system
   - 📦 Room/NPC state changes
   - 📦 Player effect application

### 6. **NPC & Story**
   - 📦 NPC conversation system
   - 📦 Quest/dialogue trees
   - 📦 Main plot (statue-person mystery)
   - 📦 Secondary plot threads

### 7. **Polish & Playtesting**
   - 📦 Accessibility options
   - 📦 Performance optimization
   - 📦 Balance and playtesting

## Current Project State
- ✅ React 19.2 + TypeScript 5.9 + Vite 7.3
- ✅ CSS Modules + Stylelint (camelCase enforced)
- ✅ ESLint 9 + TypeScript strict (no-explicit-any)
- ✅ Code standards documented and enforced
- ✅ Navigation (minimap, compass, room system)
- ✅ UI theme system (Retro Dark, Amber, Apple II Green with authentic button styling)
- ✅ Parser: look, look in, movement, examine (with abbreviations), get/take, drop, open/close, put in, save, load, clear
- ✅ Item system: Multi-tier descriptions, aliases, canOpen/canTake flags, contents arrays
- ✅ Player system: Location, inventory (20-slot), skills (examine 0-5)
- ✅ Door system: Persistent state with doorId linking, movement blocking
- ✅ Container system: Full open/close/examine/take from/put into with runtime tracking
- ✅ Save/Load system: 3 slots, localStorage persistence, modal UI, new game from empty slot, delete slots
- ✅ Fuzzy matching: Prefix matching for all item commands
- ✅ Natural language: Extensive synonyms for all commands
- ✅ Test suite: 14/14 tests passing
- 📦 World: Currently 9 rooms (need 20+)

## Next Steps (Priority Order)

### IMMEDIATE (This Session or Next)
1. **World Expansion** (6-8 hours)
   - Expand from 9 to 20+ rooms
   - Create story locations and atmosphere
   - Design room layout and connections
   - Add room-specific items and descriptions
   - Example new rooms: cave system, town, forest paths, ruins, etc.

### SHORT TERM (Next 1-2 sessions)
2. **NPC System Design & Implementation** (8-10 hours)
   - Design NPC data structure
   - Conversation tree format (JSON)
   - NPC parser (talk/speak/ask commands)
   - Conversation UI and dialogue display
   - Test with 2-3 NPCs before scaling

3. **Alchemy/Recipe System** (8-10 hours)
   - Recipe data structure
   - Item combination mechanics
   - Recipe discovery/learning
   - Crafting UI
   - Recipe validation (what can combine with what)

### MEDIUM TERM (2-3 sessions)
4. **Potion Effects** (6-8 hours)
   - Effect trigger system
   - Player effects (buffs, debuffs, transformations)
   - Room/NPC state changes from potions
   - Effect display in UI

5. **Story & Quests** (10-15 hours)
   - Main plot: Statue-person mystery
   - Quest/dialogue trees
   - Secondary plot threads
   - Consequences of NPC interactions
   - Story progression tracking

## NPC System Design (Planned)

### Phase 1: NPC Visibility & Room Presence (This Session)
**Goal:** Display NPCs in rooms, trigger appearance on events

**Data Structure (npcs.ts):**
```typescript
interface NPC {
  id: string;                    // e.g., "crow_spirit"
  name: string;                  // "Crow Spirit"
  description: string;           // Multi-line description visible in room
  aliases: string[];             // ["crow", "spirit", "bird"]
  visible: boolean;              // Initially shown/hidden
  triggers?: {
    onDoorClosed?: string;       // doorId that triggers appearance
    onItemDropped?: string;      // itemId that triggers appearance
    onRoomEnter?: boolean;       // Appears when player enters
  };
}
```

**Room Integration:**
- Add `npcs: string[]` to Room interface (list of NPC ids in room)
- Update room description output to include NPC descriptions
- NPCs listed in room like items: "The crow spirit is here."

**Trigger System:**
- Track NPC state in App.tsx: `npcState: Record<npcId, { visible: boolean }>`
- Add `triggers` field to door/event handlers
- When door closes → check if it has `onDoorClosed` trigger → change NPC visibility
- Example: Close black_door → trigger crow_spirit visibility

### Phase 2: Conversation Interface (Future Session)
**Goal:** Enable "talk to" commands and dialogue trees

**Planned Features:**
- `talk <npc>` / `speak <npc>` / `ask <npc>` commands
- Dialogue tree UI (modal or bottom panel)
- NPC response state machine
- Conversation choices

**Not implementing yet** - Just planning the architecture

## Puzzle System Design (Planned)

### Activity Commands: Turn / Push / Pull / etc
**Goal:** Enable arbitrary puzzle actions like "turn pots"

**Parser Enhancement (parser.ts):**
```typescript
export function parseTurn(command: string): { type: 'turn', target: string } | null
export function parsePush(command: string): { type: 'push', target: string } | null
// etc - generalized activity parser for puzzle interactions
```

**Item Enhancement (items.ts or room-specific):**
```typescript
interface Item {
  // ... existing fields ...
  turnDescription?: string;      // "You turn the pot and hear grinding..."
  turnEffect?: {
    message: string;
    puzzleId?: string;           // Links to puzzle solver
    revealExit?: string;         // doorId to reveal after solving
  };
  pushable?: boolean;
  // etc for other activities
}
```

**Puzzle State Tracking (App.tsx):**
```typescript
const [puzzleState, setPuzzleState] = useState<Record<string, Record<string, boolean>>>({
  pottery_chamber: {
    potsTurned: false,
    secretDoorRevealed: false
  }
});
```

**Activity Handler Flow:**
```
Player: turn pots
↓
parseTurn() → finds "pots" in room items
↓
Check item.turnEffect
↓
If turnEffect exists:
  - Display turnDescription message
  - Update puzzleState[roomId][puzzleId] = true
  - If revealExit specified:
    - Add exit to room dynamically
    - Display "A secret door appears!"
```

### Conditional/Dynamic Exits
**Goal:** Exits that appear only after puzzle is solved

**Two Approaches:**

**Approach A: Separate Hidden Exits**
```typescript
interface Room {
  exits: { [key: string]: RoomExit };
  hiddenExits?: {     // Track separately, revealed on puzzle solve
    secretDoor: {
      revealedBy: "potsPuzzle";
      exit: RoomExit;
    }
  };
}
```
- When puzzle solved → merge hiddenExits[key].exit into main exits
- Message: "A secret door opens to the north!"

**Approach B: Conditional Exits (Simpler)**
```typescript
interface RoomExit {
  // ... existing fields ...
  revealedBy?: string;    // Puzzle ID that must be solved
}
```
- Filter exits at display time: only show if revealedBy is null OR puzzleState says it's solved
- Add revealed exit to room.exits dynamically on solve

**Recommendation:** Approach B (simpler, cleaner)

### Example: Pottery Puzzle
```json
{
  "id": "pottery_chamber",
  "exits": {
    "east": { ... },
    "secretNorth": {
      "to": "secret_chamber",
      "revealedBy": "potsPuzzle",
      "exitDescription": "A hidden passage to the north.",
      "isDoor": false,  // Can't close secret doors
      "aliases": ["passage", "north"]
    }
  }
}
```

Then in pottery_chamber items:
```json
{
  "id": "massive_clay_pots",
  "name": "massive clay pots",
  "turnDescription": "You turn the pots and hear a deep grinding sound...\nA section of wall slides open to the north!",
  "turnEffect": {
    "message": "The secret passage is now accessible.",
    "puzzleId": "potsPuzzle",
    "revealExit": "secretNorth"
  }
}
```

**Implementation Steps:**
1. Add `parseTurn()` to parser.ts
2. Add `turnDescription`, `turnEffect` to items (or room-specific item overrides)
3. Add `puzzleState` to App.tsx state + save/load
4. Add activity handler in App command processor
5. Filter exits to show only revealed ones
6. Merge hidden exits into displayed exits when solved

## Technical Decisions

**State Management:**
- Currently: All state in App.tsx (~800 lines, sustainable for ~20-50 rooms)
- Recommended next: Refactor to Context API or reducer pattern when approaching 50+ rooms to improve maintainability
- Current approach works well for feature development and testing

**Data Organization:**
- Currently: Single rooms.json, items.ts, parser.ts, components/
- Future: May split rooms.json → rooms/ folder as room count grows beyond 50
- NPC data will likely need separate npcs.ts or npcs/ folder structure

**Save/Load Approach:**
- ✅ Using: localStorage for immediate implementation (no server needed)
- ✅ Approach: Serialize full GameState to JSON, store in 3 localStorage slots
- Future: Server integration for cloud saves if desired

**Parser Architecture:**
- ✅ Current: Separate parseX() functions for each command type
- ✅ Working well: Handles multi-word targets, synonyms, flexible syntax (e.g., "get knife from chest")
- Strength: Easy to expand and debug individual commands
- Potential: Consider state machine pattern if parser becomes very complex (50+ command types)

**Container System:**
- ✅ Implementation: Runtime tracking via `containerContents: Record<itemId, itemIds[]>`
- ✅ Open state: Tracked in `openItems: Set<string>`
- ✅ Advantage: Persistent in saves, mutable at runtime, easy to debug
- Limitation: Can't nest containers (intentional restriction)


