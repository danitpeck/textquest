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


