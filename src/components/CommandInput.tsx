import React, { useState } from 'react';
import styles from './CommandInput.module.css';

interface CommandInputProps {
  onCommand: (command: string) => void;
}

const CommandInput: React.FC<CommandInputProps> = ({ onCommand }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input);
      setInput('');
    }
  };

  return (
    <form className={styles.commandInput} onSubmit={handleSubmit} autoComplete="off">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a command..."
      />
      <button type="submit">Enter</button>
    </form>
  );
};

export default CommandInput;
