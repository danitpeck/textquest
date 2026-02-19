# Game Design Document

## Game Overview
- Alchemy-based text adventure game
- Player is a novice alchemist with some prior experience
- Focus on exploration, recipe discovery, and non-combat solutions
- ASCII mini map and minimalist, color-enhanced UI

## Core Gameplay Loop
- Collect ingredients
- Discover and learn alchemical recipes
- Craft potions with specific effects
- Apply potions to solve puzzles, access new areas, or interact with NPCs
- Advance story through missions and exploration

## Example Potions & Effects
- Grow vines to reach new areas
- Create a companion animal (solves social or environmental challenges)
- Restore NPCs (e.g., revive a statue-person)

## Narrative Structure
- Main plot: Revive a statue-person and help them
- Secondary plot: Unrelated thread for alternate progression
- Player starts with one of three starter potions
- Progression through study and discovery

## Exploration & Interaction
- Text-based room descriptions, with more detail via 'look', 'examine', 'study', 'investigate'
- Skill-based information tiers for 'examine/study/investigate'
- Tagging system for fully-explored items

## Parser Commands (Examples)
- look, look me, look north, look (npc)
- get/take (item)
- open/close (object)
- examine/study/investigate (item)
- talk to (npc)

## UI/UX
- ASCII mini map
- Minimalist, color-coded UI
- Optional conversation UI for NPCs

## Progression & Rewards
- Recipe/secret/quest completion
- NPC friendship meters
- Non-lethal conflict resolution

## Areas for Further Detail
- List of potion effects
- Ingredient/recipe list
- Full plot outline
- NPC list and roles
- Skill progression system

## ASCII Mini Map & Exits Visualization

- The game displays a compact ASCII mini map (default 3x3 grid) showing the player’s current room (@) and immediate surroundings.
- Map symbols:
  - [@] = player’s current room
  - [ ] = adjacent rooms (empty if unmapped)
  - Lines (|, -, +) show possible connections/exits
- Directly below or beside the map, a compass rose (N, S, E, W, U, D) displays available exits, with directions highlighted if accessible from the current room.
- The mini map is always visible in the UI for spatial awareness and retro feel.
- Future upgrades (items, spells, abilities) can expand the map to 4x4 or 5x5, revealing a larger area and more rooms at once.
- This system supports both classic navigation and rewarding exploration/progression.

Example (3x3):
```
[ ]-[ ]-[ ]
 |   |   |
[ ]-[@]-[ ]
 |   |   |
[ ]-[ ]-[ ]
```

Example (5x5, with upgrade):
```
[ ]-[ ]-[ ]-[ ]-[ ]
 |   |   |   |   |
[ ]-[ ]-[ ]-[ ]-[ ]
 |   |   |   |   |
[ ]-[ ]-[@]-[ ]-[ ]
 |   |   |   |   |
[ ]-[ ]-[ ]-[ ]-[ ]
 |   |   |   |   |
[ ]-[ ]-[ ]-[ ]-[ ]
```

- The map rendering logic should support variable sizes for easy upgrades.
- The compass and exits list should remain clear and accessible for all players.

## Retro ASCII Compass Design

- The compass is displayed with cardinal directions and the player marker (*) between the East/West exits.
- Example (player at center, all directions available):

```
       N
       |  U
 W <--(*)--> E
    D  |
       S
```

- N/S can be shown above/below, or as part of the minimap context.
- Highlight available directions (color, bold, or brackets). Dim or omit unavailable directions.
- This design is compact, retro, and easy to parse at a glance.
- The minimap and compass are separate components, so the compass can be iterated or replaced independently.
