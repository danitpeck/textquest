import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommandInput from './CommandInput';

// Ensure valid Vitest test structure and explicit imports
describe('CommandInput', () => {
  it('calls onCommand with input value', () => {
    const onCommand = vi.fn();
    render(<CommandInput onCommand={onCommand} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: 'look' } });
    fireEvent.submit(input.closest('form')!);
    expect(onCommand).toHaveBeenCalledWith('look');
  });
});
