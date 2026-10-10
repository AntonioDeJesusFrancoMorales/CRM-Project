import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SensitiveField, SensitiveWriteNotice } from './PermissionState';

const usePermissionsMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/permissions/context', () => ({
  usePermissions: usePermissionsMock,
}));

function setPermissions(
  status: 'resolved' | 'unavailable',
  canReadGroup: boolean,
  canWriteGroup: boolean,
) {
  usePermissionsMock.mockReturnValue({
    status,
    canReadGroup: () => canReadGroup,
    canWriteGroup: () => canWriteGroup,
  });
}

describe('sensitive permission surfaces', () => {
  it('does not render sensitive data without the explicit read group', () => {
    setPermissions('resolved', false, false);

    render(
      <SensitiveField resource="TRATO" group="FINANCIERO">
        Importe confidencial
      </SensitiveField>,
    );

    expect(screen.queryByText('Importe confidencial')).not.toBeInTheDocument();
    expect(screen.getByText('Sin permiso')).toHaveClass('block');
  });

  it('keeps sensitive read and write surfaces blocked while permissions are unavailable', () => {
    setPermissions('unavailable', false, false);

    render(
      <>
        <SensitiveField resource="TRATO" group="FINANCIERO">
          Importe confidencial
        </SensitiveField>
        <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
          <input aria-label="Importe confidencial" />
        </SensitiveWriteNotice>
      </>,
    );

    expect(screen.queryByText('Importe confidencial')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Importe confidencial' })).not.toBeInTheDocument();
    expect(screen.getByText('Permiso no disponible')).toBeInTheDocument();
    expect(screen.getByText(/dato sensible queda bloqueado/i)).toBeInTheDocument();
  });

  it('hides denied write fields without rendering an orphaned notice', () => {
    setPermissions('resolved', true, false);

    render(
      <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
        <input aria-label="Importe editable" />
      </SensitiveWriteNotice>,
    );

    expect(screen.queryByRole('textbox', { name: 'Importe editable' })).not.toBeInTheDocument();
    expect(screen.queryByText(/permiso de escritura/i)).not.toBeInTheDocument();
  });

  it('renders the sensitive children only when read and write groups are granted', () => {
    setPermissions('resolved', true, true);

    render(
      <>
        <SensitiveField resource="TRATO" group="FINANCIERO">
          Importe visible
        </SensitiveField>
        <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
          <input aria-label="Importe editable" />
        </SensitiveWriteNotice>
      </>,
    );

    expect(screen.getByText('Importe visible')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Importe editable' })).toBeInTheDocument();
  });
});
