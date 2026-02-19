import './App.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';

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

    // Look parser
    const look = parseLook(cmd);
    if (look) {
      if (!look.target) {
        setOutput(prev => [...prev, currentRoom.description]);
        return;
      }
      if (look.target === 'sky') {
        if (currentRoom.skyDescription) {
          setOutput(prev => [...prev, currentRoom.skyDescription ?? "You can't see the sky from here."]);
        } else {
          setOutput(prev => [...prev, "You can't see the sky from here."]);
        }
        return;
      }
      // look <direction>
      const dir = look.target;
      const exit = currentRoom.exits[dir];
      if (exit && exit.exitDescription) {
        setOutput(prev => [...prev, exit.exitDescription ?? "You see nothing special that way."]);
      } else if (exit) {
        setOutput(prev => [...prev, "You see nothing special that way."]);
      } else {
        setOutput(prev => [...prev, "There's nothing notable in that direction."]);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button
          style={{
            marginRight: 8,
            background: theme === 'default' ? 'var(--accent)' : 'var(--bg-panel)',
            color: theme === 'default' ? 'var(--button-text)' : 'var(--text-main)',
            border: 'none',
            borderRadius: 4,
            padding: '0.3rem 0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            boxShadow: theme === 'default' ? '0 1px 4px #0004' : 'none',
            transition: 'background 0.2s',
          }}
          onClick={() => setTheme('default')}
        >
          Retro Dark
        </button>
        <button
          style={{
            background: theme === 'amber' ? 'var(--accent)' : 'var(--bg-panel)',
            color: theme === 'amber' ? 'var(--button-text)' : 'var(--text-main)',
            border: 'none',
            borderRadius: 4,
            padding: '0.3rem 0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            boxShadow: theme === 'amber' ? '0 1px 4px #0004' : 'none',
            transition: 'background 0.2s',
          }}
          onClick={() => setTheme('amber')}
        >
          Amber Terminal
        </button>
        <button
          style={{
            background: theme === 'green' ? 'var(--accent)' : 'var(--bg-panel)',
            color: theme === 'green' ? 'var(--button-text)' : 'var(--text-main)',
            border: 'none',
            borderRadius: 4,
            padding: '0.3rem 0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            boxShadow: theme === 'green' ? '0 1px 4px #0004' : 'none',
            transition: 'background 0.2s',
            marginLeft: 8
          }}
          onClick={() => setTheme('green')}
        >
          Apple II Green
        </button>
      </div>
      <h1>TextQuest</h1>
      <GameWindow output={output} />
      <CommandInput onCommand={handleCommand} />
    </div>
  );
}

export default App;
