import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TareaDeleteDialog } from '../components/TareaDeleteDialog';

describe('TareaDeleteDialog', () => {
  it('applies safe wrapping to a long unbroken task title', () => {
    const longTitle = 'Tarea'.padEnd(240, 'x');

    render(
      <TareaDeleteDialog
        open
        onOpenChange={vi.fn()}
        titulo={longTitle}
        onConfirm={vi.fn()}
      />,
    );

    const title = screen.getByText(longTitle);
    expect(title).toBeInTheDocument();
    expect(title.parentElement).toHaveClass('[overflow-wrap:anywhere]');
  });
});
