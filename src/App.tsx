import './App.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';
import Compass from './components/Compass';

import { rooms } from './engine/rooms';
import type { Room } from './engine/rooms';
import { parseMovement, parseLook } from './engine/parser';

const App: React.FC = () => {
  // Start in the first room from the data
  const [currentRoom, setCurrentRoom] = useState<Room>(rooms[0]);
  const [output, setOutput] = useState<string[]>([
    currentRoom.description
  ]);
  const [theme, setTheme] = useState<'default' | 'amber' | 'green'>('default');

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
          setOutput(prev => [...prev, nextRoom.description]);
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
      <h1>TextQuest</h1>
      {/* Compass UI above the game window */}
      <Compass
        exits={Object.keys(currentRoom.exits)}
      />
      <GameWindow output={output} />
      <CommandInput onCommand={handleCommand} />
    </div>
  );
}

export default App;
