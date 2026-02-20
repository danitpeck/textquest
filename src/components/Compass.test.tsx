import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Compass from './Compass';
import type { CompassDirection } from './Compass';

describe('Compass', () => {
  it('renders all directions, highlighting available exits', () => {
    const exits: CompassDirection[] = ['n', 'e', 's', 'w', 'u', 'd'];
    render(<Compass exits={exits} />);
    // All directions should be bold (active)
    ['N', 'E', 'S', 'W', 'U', 'D'].forEach(dir => {
      const el = screen.getByText(dir);
      expect(el.className).toMatch(/compassDirActive/);
      expect(el.className).not.toMatch(/compassDirHidden/);
    });
  });

  it('renders inactive directions as dimmed', () => {
    const exits: CompassDirection[] = ['n', 's'];
    render(<Compass exits={exits} />);
    // N and S active, others dimmed
    ['N', 'S'].forEach(dir => {
      const el = screen.getByText(dir);
      expect(el.className).toMatch(/compassDirActive/);
      expect(el.className).not.toMatch(/compassDirHidden/);
    });
    ['E', 'W', 'U', 'D'].forEach(dir => {
      const el = screen.getByText(dir);
      expect(el.className).toMatch(/compassDirHidden/);
    });
  });

  it('accepts long direction names', () => {
    render(<Compass exits={['north', 'down']} />);
    expect(screen.getByText('N').className).toMatch(/compassDirActive/);
    expect(screen.getByText('D').className).toMatch(/compassDirActive/);
  });
});
