// Tests del ThemeProvider y useTheme — Strict TDD RED.
// Cubre: default theme, toggle cambia y persiste, aplica clase "dark" al documentElement,
//        resuelve "system" con matchMedia.
// Los estilos CSS NO se testean aquí — solo la lógica del contexto.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeProvider';

// ── Helper: componente que expone el theme actual ─────────────────────────────
function ThemeDisplay() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => setTheme('dark')}>activar dark</button>
      <button onClick={() => setTheme('light')}>activar light</button>
      <button onClick={() => setTheme('system')}>activar system</button>
    </div>
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  // Limpiar localStorage
  localStorage.clear();
  // Limpiar clase dark del documentElement
  document.documentElement.classList.remove('dark');
  // Reset matchMedia mock (dark = false por default en tests)
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : false,
      media: query,
      onchange: null,
      addEventListenerCalled: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThemeProvider — tema por defecto', () => {
  it('(a) sin localStorage → defaultTheme es "system"', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('system');
  });

  it('(b) acepta defaultTheme="light" como prop', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('(c) localStorage existente sobreescribe defaultTheme', () => {
    localStorage.setItem('crm-theme', 'dark');
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
});

describe('ThemeProvider — setTheme cambia el tema y persiste en localStorage', () => {
  it('(d) setTheme("dark") actualiza el valor del contexto', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');

    await user.click(screen.getByText('activar dark'));

    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('(e) setTheme("dark") persiste en localStorage con key "crm-theme"', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    await user.click(screen.getByText('activar dark'));
    expect(localStorage.getItem('crm-theme')).toBe('dark');
  });

  it('(f) setTheme("light") persiste "light" en localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('crm-theme', 'dark');
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    await user.click(screen.getByText('activar light'));
    expect(localStorage.getItem('crm-theme')).toBe('light');
  });
});

describe('ThemeProvider — aplica clase "dark" al documentElement', () => {
  it('(g) theme="dark" → html.classList contiene "dark"', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByText('activar dark'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('(h) theme="light" → html.classList NO contiene "dark"', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByText('activar light'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('(i) montado con defaultTheme="dark" → html tiene clase "dark" inmediatamente', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

describe('ThemeProvider — resuelve "system" con matchMedia', () => {
  it('(j) system + matchMedia dark=false → html sin clase "dark"', () => {
    // matchMedia ya mockeado con dark=false en beforeEach
    render(
      <ThemeProvider defaultTheme="system">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(screen.getByTestId('theme-value').textContent).toBe('system');
  });

  it('(k) system + matchMedia dark=true → html con clase "dark"', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    render(
      <ThemeProvider defaultTheme="system">
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByTestId('theme-value').textContent).toBe('system');
  });
});

describe('ThemeProvider — useTheme lanza fuera de contexto', () => {
  it('(l) useTheme sin Provider lanza error', () => {
    // Silenciar el error de consola que React emite en renders fallidos
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeDisplay />)).toThrow();
    consoleSpy.mockRestore();
  });
});
