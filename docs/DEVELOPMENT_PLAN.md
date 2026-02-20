# Development Plan

## Recent Session Improvements (Session 3)
- ✅ NPC alias support in look/examine commands
- ✅ NPC appearMessage & disappearMessage fields  
- ✅ Exit visibility checks properly block hidden/unrevealed exits
- ✅ Direction abbreviation priority (s/w/e/n/u/d) now take precedence over alias prefix matches
- ✅ Consistent error messages for blocked movement
- ✅ Minimap now respects puzzle state (hidden rooms don't appear)
- ✅ Item description fallback in look command for alias matches
- ✅ Cleaner exit format display (removed outer parentheses)

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

### 3. **Puzzle System** ✅ COMPLETE
   - ✅ Activity commands: turn, push, pull (with synonyms)
   - ✅ Puzzle state tracking per room
   - ✅ Dynamic exits revealed by puzzle solve
   - ✅ Conditional exit filtering (revealedBy mechanism)
   - ✅ Activity effect messages and puzzle callbacks
   - ✅ "Already solved" checks prevent repeat interactions

### 4. **NPC System Phase 1** ✅ COMPLETE
   - ✅ NPC visibility & room presence
   - ✅ Triggers: onDoorClosed, onDoorOpened
   - ✅ NPC state tracking and persistence
   - ✅ NPC descriptions in room output
   - ✅ NPC look/examine with alias matching
   - ✅ Appear/disappear messages
   - ✅ Example: Crow spirit (visible when black door closes, disappears when opened)

### 5. **World Expansion**
   - 📦 Expand rooms from 9 to 20+ with story locations
   - 📦 NPC conversation system (Phase 2)
   - 📦 Conversation/dialogue tree system

### 6. **Alchemy System**
   - 📦 Recipe data structure and storage
   - 📦 Recipe discovery/learning mechanics
   - 📦 Crafting UI and item combination

### 7. **Potion Effects**
   - 📦 Effect trigger system
   - 📦 Room/NPC state changes
   - 📦 Player effect application

### 8. **NPC & Story (Phase 2)**
   - 📦 NPC conversation system
   - 📦 Quest/dialogue trees
   - 📦 Main plot (statue-person mystery)
   - 📦 Secondary plot threads

### 9. **Polish & Playtesting**
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
- ✅ Exit visibility system: Hidden/unrevealed exits properly blocked from movement, look, open, close
- ✅ Direction priority: Single letters (s/w/e/n/u/d) take priority over alias prefix matches
- ✅ NPC alias matching: Full support in look/examine commands
- ✅ Minimap: Aware of puzzle state, doesn't show unrevealed rooms
- 📦 World: Currently 9 rooms (need 20+)
- 📦 NPC Phase 2: Conversation/dialogue trees

## Next Steps (Priority Order)

### IMMEDIATE (Next Session)
1. **World Expansion** (6-8 hours)
   - Expand from 9 to 20+ rooms
   - Create story locations and atmosphere
   - Design room layout and connections
   - Add room-specific items and descriptions
   - Example new rooms: cave system, town, forest paths, ruins, etc.

### SHORT TERM (Next 1-2 sessions)
2. **NPC Phase 2: Conversation System** (8-10 hours)
   - Design dialogue tree format (JSON)
   - NPC parser: talk/speak/ask commands
   - Conversation UI and dialogue display
   - Response state machine
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

## Completed Sessions Summary

### Session 1: Core Systems
- ✅ React + TypeScript + Vite setup with strict config
- ✅ CSS Modules + theme system (3 themes with authentic retro styling)
- ✅ Basic parser (look, get, drop, examine, movement, open/close)
- ✅ Item system with multi-tier descriptions and aliases
- ✅ Inventory (20-slot) and container system (open/close/take from/put into)
- ✅ Room navigation with arbitrary exit names and aliases
- ✅ Door system with persistent state
- ✅ 14/14 tests passing

### Session 2: Save/Load & Polish
- ✅ 3-slot save/load system with localStorage persistence
- ✅ Save/load modal UI with timestamps and delete buttons
- ✅ Multiple save commands (save 1/2/3, save)
- ✅ Inventory, skills, item/door state, containers all persist
- ✅ UI theme selector
- ✅ Compass (N/S/E/W directional indicator)
- ✅ Minimap (3x3 grid with room symbols and reachability)
- ✅ New game from empty slot

### Session 3: Activities & NPCs (TODAY)
- ✅ Puzzle system: Activity commands (turn, push, pull)
- ✅ Dynamic exits revealed by puzzle solves
- ✅ Puzzle state tracking and persistence
- ✅ NPC system Phase 1:
  - ✅ NPC visibility triggers (door open/close)
  - ✅ NPC state tracking and persistence
  - ✅ Crow spirit example implementation
  - ✅ Look/examine NPC with alias matching
  - ✅ Appear/disappear messages
- ✅ Exit visibility filtering (hidden exits properly blocked)
- ✅ Direction priority handling (s takes precedence over "shattered door")
- ✅ Item/NPC alias support in look command
- ✅ Minimap puzzle awareness (hidden exits don't create phantom rooms)

### Phase 1: NPC Visibility & Room Presence ✅ COMPLETE
**Goal:** Display NPCs in rooms, trigger appearance on events

**Status:** ✅ Fully implemented. Crow spirit example shows:
- Appears when black_door closes
- Disappears when black_door opens
- Visible in room descriptions
- Look/examine with aliases: "look crow", "examine spirit", etc.
- Custom appear/disappear messages
- Backward-compatible NPC state in saves

**Files:**
- `src/engine/npcs.ts`: NPC data structure, visibility logic, database
- `src/App.tsx`: NPC state tracking, visibility triggers, appear/disappear handlers

**Data Structure (npcs.ts):**
```typescript
interface NPC {
  id: string;                    // e.g., "crow_spirit"
  name: string;                  // "Crow Spirit"
  description: string;           // Multi-line description visible in room
  aliases: string[];             // ["crow", "spirit", "bird"]
  visibleByDefault: boolean;     // Initially shown/hidden
  appearMessage?: string;        // Custom message when NPC appears
  disappearMessage?: string;     // Custom message when NPC disappears
  triggers?: {
    onDoorClosed?: string;       // doorId that triggers appearance
    onDoorOpened?: string;       // doorId that triggers disappearance
    onItemDropped?: string;      // itemId that triggers appearance (future)
    onRoomEnter?: boolean;       // Appears when player enters (future)
  };
}
```

**Room Integration:**
- Add `npcs: string[]` to Room interface (list of NPC ids in room)
- NPCs displayed in room description: "The crow spirit is here, clacking its beak."
- NPC descriptions separated by blank lines when multiple present

**Trigger System:**
- Track NPC state in App.tsx: `npcState: Record<npcId, boolean>`
- `onDoorClosed` trigger: When exit with doorId closes → set npcState[npcId] = true
- `onDoorOpened` trigger: When exit with doorId opens → set npcState[npcId] = false
- Display custom appear/disappear messages when state changes
- NPC state persisted in GameState saves

### Phase 2: NPC Conversation System 📦 NEXT
**Goal:** Enable "talk to" commands and dialogue trees

**Planned Data Structure:**
- `talk <npc>` / `speak <npc>` / `ask <npc>` commands
- Dialogue tree UI (modal or bottom panel)
- NPC response state machine
- Conversation choices

**Not implementing yet** - Just planning the architecture

## Puzzle System Design ✅ COMPLETE

### Activity Commands: Turn / Push / Pull ✅ IMPLEMENTED
**Goal:** Enable arbitrary puzzle actions like "turn pots"

**Status:** ✅ Fully implemented with pottery chamber secret door example

**Parser (parser.ts):** 
- ✅ `parseTurn()`, `parsePush()`, `parsePull()` all working
- ✅ Synonym support: turn/rotate/spin/twist, push/shove/press, pull/yank/tug/drag
- ✅ Returns structured objects with type and target

**Item Structure (items.ts):**
```typescript
interface GameItem {
  // ... existing fields ...
  turnDescription?: string;       // e.g., "You turn the pots..."
  turnEffect?: ActivityEffect;
  pushDescription?: string;
  pushEffect?: ActivityEffect;
  pullDescription?: string; 
  pullEffect?: ActivityEffect;
}

interface ActivityEffect {
  message: string;                // Shown when puzzle completes
  puzzleId?: string;              // Unique puzzle identifier
  revealExit?: string;            // Exit direction to reveal after solving
}
```

**Puzzle State Tracking:**
- ✅ Stores: `puzzleState: Record<roomId, Record<puzzleId, boolean>>`
- ✅ Persists across saves/loads
- ✅ "Already solved" checks prevent repeat interactions

**Example Implementation (Pottery Puzzle):**
- ✅ `massive_clay_pots` item in pottery_chamber
- ✅ `turn pots` → solves potsPuzzle
- ✅ Reveals secret exit north to secret_chamber
- ✅ Message: "A hidden door opens..."

### Conditional/Dynamic Exits ✅ IMPLEMENTED
**Goal:** Exits that appear only after puzzle is solved

**Implementation (Approach B):**
```typescript
interface RoomExit {
  // ... other fields ...
  revealedBy?: string;    // Puzzle ID that must be solved first
}
```

**Exit Visibility Filtering:**
- ✅ `isExitVisible()` checks if exit.revealedBy is solved
- ✅ Hidden exits filtered from: movement, look, open, close
- ✅ Minimap aware of puzzle state (hidden rooms don't show)
- ✅ User gets consistent "You can't go that way." message

### Puzzle System Files:
- `src/engine/parser.ts`: parseTurn(), parsePush(), parsePull()
- `src/engine/items.ts`: ActivityEffect interface, massive_clay_pots definition
- `src/App.tsx`: isExitVisible(), activity handlers, puzzle state tracking
- `src/data/rooms.json`: pottery_chamber north exit with revealedBy: potsPuzzle
- `src/components/AsciiMap.tsx`: Puzzle-aware minimap rendering

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


