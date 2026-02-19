import React, { useEffect, useRef } from 'react';

interface GameWindowProps {
  output: string[];
}

const GameWindow: React.FC<GameWindowProps> = ({ output }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [output]);
  return (
    <div className="game-window">
      {output.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default GameWindow;
