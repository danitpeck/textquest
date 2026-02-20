# Development Plan

## Milestones

### 1. **Core Engine & Parser** ✅ COMPLETE
   - ✅ Text parser: look, get/take, drop, examine, open/close, movement
   - ✅ Fuzzy/prefix item matching & natural language synonyms
   - ✅ Room and object system with arbitrary exit names
   - ✅ Inventory system (20-slot max)
   - ✅ Door system with persistent state and movement blocking
   - ✅ Multi-word command support (put down, set down)
   - 🔄 **Containers** (IN PROGRESS) - Items with contents, open/close, take/put items from containers

### 2. **Save/Load System** ✅ COMPLETE
   - ✅ 3-slot save system with localStorage
   - ✅ Persists: location, inventory, skills, item/door state, containers
   - ✅ Save/Load buttons in UI
   - ✅ Load menu modal with room names and timestamps
   - ✅ Commands: save, save 1/2/3, load, load 1/2/3

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
- ✅ UI theme system (Retro Dark, Amber, Green Apple II)
- ✅ Parser: look, movement, examine, get/take, drop, open/close
- ✅ Item system: Multi-tier descriptions, aliases, canOpen/canTake flags
- ✅ Player system: Location, inventory (20-slot), skills (examine 0-5)
- ✅ Door system: Persistent state with doorId linking, movement blocking
- ✅ Fuzzy matching: Prefix matching for all item commands
- ✅ Test suite: 14/14 tests passing
- 🔄 Containers: Need to finish take/put items from/to containers

## Next Steps (Priority Order)

### IMMEDIATE (This Session)
1. **Finish Containers** (1-2 hours)
   - Implement taking items from opened containers
   - Implement putting items into opened containers
   - Mark Milestone 1 as complete

2. **Design Save/Load Architecture** (1 hour)
   - Define game state shape for persistence
   - Decide: localStorage vs server
   - Plan UI for save/load slots

### SHORT TERM (Next 1-2 sessions)
3. **Implement Save/Load System** (4-6 hours)
   - Serialize/deserialize game state
   - Save to localStorage
   - Load game UI
   - Auto-save on room change
   - Test persistence across browser refresh

4. **World Expansion** (6-8 hours)
   - Create 12-15 new rooms
   - Write descriptions
   - Map out room connections
   - Plan main story progression

### MEDIUM TERM (2-3 sessions)
5. **NPC System Design** (2-3 hours)
   - NPC data structure
   - Conversation tree format
   - Dialogue conditional logic

6. **NPC Implementation** (6-8 hours)
   - NPC parser (talk/speak commands)
   - Conversation UI
   - Basic dialogue trees

### LONGER TERM
7. **Alchemy/Recipes** (8-10 hours)
8. **Potion Effects** (6-8 hours)
9. **Story & Quests** (10-15 hours)

## Technical Decisions

**State Management:**
- Currently: All state in App.tsx (sustainable for ~50 rooms)
- Consider: Game state context for better separation if exceeds 100+ rooms

**Data Organization:**
- Currently: Single rooms.json, items.ts, parser.ts
- Future: May split rooms.json → rooms/ folder as room count grows

**Save/Load Approach:**
- Recommended: localStorage for immediate implementation (no server needed)
- Future: Server integration for cloud saves

**Containers Architecture:**
- Items can have `contents: string[]` array of item IDs
- `openItems: Set<string>` tracks which containers are open
- Need: Logic to show contents when open, allow take/put


