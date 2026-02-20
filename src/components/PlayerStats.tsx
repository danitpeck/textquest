import styles from './PlayerStats.module.css';
import type { Player } from '../engine/player';

interface PlayerStatsProps {
  player: Player;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const getSkillBar = (level: number, max: number = 5): string => {
    return `${'▓'.repeat(level)}${'░'.repeat(max - level)}`;
  };

  return (
    <div className={styles.statsPanel}>
      <div className={styles.statLine}>
        Examine: {player.skills.examine}/5 {getSkillBar(player.skills.examine)}
      </div>
      <div className={styles.statLine}>
        Learn: {player.skills.learn}/5 {getSkillBar(player.skills.learn)}
      </div>
      <div className={styles.statLine}>
        Craft: {player.skills.craft}/5 {getSkillBar(player.skills.craft)}
      </div>
    </div>
  );
};

export default PlayerStats;
