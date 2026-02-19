import './App.css';
import './components/PlayerOptionsBar.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';

import CompassFloat from './components/CompassFloat';
import AsciiMap from './components/AsciiMap';

import { rooms } from './engine/rooms';
import type { Room } from './engine/rooms';
import { parseMovement, parseLook } from './engine/parser';

const App: React.FC = () => {
  // Start in the first room from the data
  const [currentRoom, setCurrentRoom] = useState<Room>(rooms[0]);
  const [output, setOutput] = useState<string[]>([
    currentRoom.description,
    (() => {
      const exitList = Object.entries(currentRoom.exits)
        .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
        .join(', ');
      return exitList ? `(Exits: ${exitList})` : '(No visible exits)';
    })()
  ]);
  const [theme, setTheme] = useState<'default' | 'amber' | 'green'>('default');
  // Floating compass state
  const [showCompass, setShowCompass] = useState(true);
  // ASCII map toggle state
  const [showMap, setShowMap] = useState(true);

  const handleCommand = (command: string) => {
    setOutput(prev => [...prev, `> ${command}`]);
    const cmd = command.trim().toLowerCase();

    // Look parser first, so 'look north' doesn't trigger movement
    const look = parseLook(cmd);
    if (look) {
      if (!look.target) {
        setOutput(prev => [...prev, currentRoom.description]);
        return;
      }
      // look <sky> (always handle first)
      if (look.target === 'sky') {
        if (currentRoom.skyDescription) {
          setOutput(prev => [...prev, currentRoom.skyDescription ?? "You can't see the sky from here."]);
        } else {
          setOutput(prev => [...prev, "You can't see the sky from here."]);
        }
        return;
      }
      // look <thing> (custom look descriptions)
      if (currentRoom.lookDescriptions && currentRoom.lookDescriptions[look.target]) {
        const desc = currentRoom.lookDescriptions[look.target];
        setOutput(prev => [...prev, desc ?? "You see nothing special."]);
        return;
      }
      // look <direction>
      const dir = look.target;
      const exit = currentRoom.exits[dir];
      if (exit && exit.exitDescription) {
        setOutput(prev => [...prev, exit.exitDescription ?? "You see nothing special that way."]);
        return;
      } else if (exit) {
        setOutput(prev => [...prev, "You see nothing special that way."]);
        return;
      }
      // fallback
      setOutput(prev => [...prev, "You see nothing special."]);
      return;
    }

    // Movement parser
    const dir = parseMovement(cmd);
    if (dir) {
      const exit = currentRoom.exits[dir];
      if (exit) {
        const nextRoom = rooms.find(r => r.id === exit.to);
        if (nextRoom) {
          setCurrentRoom(nextRoom);
          const exitList = Object.entries(nextRoom.exits)
            .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
            .join(', ');
          setOutput(prev => [
            ...prev,
            nextRoom.description,
            exitList ? `(Exits: ${exitList})` : '(No visible exits)'
          ]);
        } else {
          setOutput(prev => [...prev, "You can't go that way."]);
        }
      } else {
        setOutput(prev => [...prev, "You can't go that way."]);
      }
      return;
    }

    if (cmd.length > 0) {
      setOutput(prev => [...prev, "I don't understand that command."]);
    }
    // Add more commands here later
  };

  // Set theme class on root
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.classList.remove('theme-amber', 'theme-green');
    if (theme === 'amber') root.classList.add('theme-amber');
    if (theme === 'green') root.classList.add('theme-green');
  }, [theme]);

  return (
    <div className="game-container">
      {/* Theme Switcher */}
      <div className="theme-switcher">
        <button
          className={`theme-button${theme === 'default' ? ' selected' : ''}`}
          onClick={() => setTheme('default')}
        >
          Retro Dark
        </button>
        <button
          className={`theme-button${theme === 'amber' ? ' selected' : ''}`}
          onClick={() => setTheme('amber')}
        >
          Amber Terminal
        </button>
        <button
          className={`theme-button${theme === 'green' ? ' selected' : ''}`}
          onClick={() => setTheme('green')}
        >
          Apple II Green
        </button>
      </div>

      {/* App Title */}
      <h1>TextQuest</h1>

      {/* Game Window and Command Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <GameWindow output={output} />
        <CommandInput onCommand={handleCommand} />
      </div>
      
      {/* Player Options Bar */}
      <div className="player-options-bar">
        <button
          className={`theme-button${showCompass ? ' selected' : ''}`}
          style={{ minWidth: 140 }}
          onClick={() => setShowCompass(v => !v)}
          aria-pressed={showCompass}
        >
          {showCompass ? 'Hide Compass' : 'Show Compass'}
        </button>
        <button
          className={`theme-button${showMap ? ' selected' : ''}`}
          style={{ minWidth: 140 }}
          onClick={() => setShowMap(v => !v)}
          aria-pressed={showMap}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
        {/* Add more player config buttons here in the future */}
      </div>

      {/* Floating Compass */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* Floating Compass window, now near the game window */}
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <CompassFloat
            exits={Object.keys(currentRoom.exits)}
            visible={showCompass}
            onClose={() => setShowCompass(false)}
          />
        </div>
      </div>

      {/* ASCII Map */}
      {showMap && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AsciiMap
            rooms={rooms}
            currentRoomId={currentRoom.id}
            size={3}
          />
        </div>
      )}
    </div>
  );
}

export default App;
