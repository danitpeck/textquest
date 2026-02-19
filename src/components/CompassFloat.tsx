import React from 'react';
import Compass from './Compass';
import './CompassFloat.css';

interface CompassFloatProps {
  exits: string[];
  visible: boolean;
  onClose: () => void;
}

const CompassFloat: React.FC<CompassFloatProps> = ({ exits, visible, onClose }) => {
  return (
    <div className={`compass-float${visible ? '' : ' compass-float-hidden'}`}>
      <button className="compass-float-toggle" onClick={onClose} title="Hide Compass">×</button>
      <Compass exits={exits} />
    </div>
  );
};

export default CompassFloat;
