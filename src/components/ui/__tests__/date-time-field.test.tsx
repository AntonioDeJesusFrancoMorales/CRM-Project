import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker, DateTimePicker } from '../date-time-field';
import { Dialog, DialogContent } from '../dialog';

describe('DateTimePicker (inline)', () => {
  it('despliega el calendario y al elegir un día emite "YYYY-MM-DDTHH:mm" con hora default', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /elegí fecha/i }));
    const dias = await screen.findAllByLabelText(/^\d{4}-\d{2}-\d{2}$/);
    await user.click(dias[10]!);

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T09:00$/));
  });

  it('funciona INLINE dentro de un Dialog modal', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dialog open>
        <DialogContent>
          <DateTimePicker value={null} onChange={onChange} />
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: /elegí fecha/i }));
    const dias = await screen.findAllByLabelText(/^\d{4}-\d{2}-\d{2}$/);
    await user.click(dias[10]!);

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T09:00$/));
  });
});

describe('DatePicker (inline)', () => {
  it('al elegir un día emite "YYYY-MM-DD" y colapsa el calendario', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /elegí una fecha/i }));
    const dias = await screen.findAllByLabelText(/^\d{4}-\d{2}-\d{2}$/);
    await user.click(dias[5]!);

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    // El calendario colapsa tras seleccionar.
    expect(screen.queryByLabelText(/^\d{4}-\d{2}-\d{2}$/)).not.toBeInTheDocument();
  });
});
