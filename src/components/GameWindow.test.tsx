import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameWindow from './GameWindow';

describe('GameWindow', () => {
  it('renders output lines', () => {
    render(<GameWindow output={["Line 1", "Line 2"]} />);
    expect(screen.getByText("Line 1")).toBeInTheDocument();
    expect(screen.getByText("Line 2")).toBeInTheDocument();
  });
});
