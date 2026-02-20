# Development Plan

## Milestones
1. **Core Engine & Parser** ✅ (In Progress)
   - Implement basic text parser (look, get, open, examine, talk)
   - Room and object system
   - Inventory and item interaction
2. **Alchemy System** (Next)
   - Ingredient collection
   - Recipe discovery and crafting
   - Potion effect application
3. **Exploration & Map** ✅ (Partially Complete)
   - ASCII mini map rendering ✅
   - Room navigation and descriptions ✅
   - Compass implementation ✅
4. **Narrative & Quests**
   - Main plot (statue-person)
   - Secondary plot thread
   - NPCs and conversation system
5. **UI/UX Enhancements**
   - Color-coded UI ✅
   - Conversation UI
   - Accessibility options
6. **Polish & Playtesting**
   - Skill progression
   - Tagging for explored items
   - Friendship meters and secrets

## Technical Considerations
- Language/engine selection ✅
- Data structure for rooms, items, recipes ✅ (JSON-based)
- Save/load system
- Modular design for extensibility ✅ (CSS Modules, component-based)

## Next Steps (Priority Order)
1. **Expand Parser** - Add support for more commands (examine, open, close, get/take)
2. **Item & Inventory System** - Create item data structures, add inventory management UI
3. **Recipe & Crafting System** - Define recipes, implement learn/craft mechanics
4. **Potion Effects** - Implement effect application and room/NPC changes
5. **NPC Conversation System** - Build conversation UI and dialogue trees
6. **Plot & Rooms** - Expand room database with main story locations

## Current Project State
- ✅ React + TypeScript + Vite foundation
- ✅ CSS Modules + Stylelint/ESLint enforcement
- ✅ Code standards documented and enforced
- ✅ Navigation (minimap, compass, room system)
- ✅ Basic UI theme system (Retro Dark, Amber, Green Apple II)
- ✅ Test suite set up and passing
- 🔄 Parser: Only 'look' and 'move' are fully implemented
