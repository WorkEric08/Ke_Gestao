import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf-8'));

describe('manifest do PWA', () => {
  // `display_override` vence `display`. Com "minimal-ui" na lista o Chrome do Android abre o app com a barra
  // do navegador (título, endereço do site e menu ⋮) por cima da tela.
  it('abre em tela cheia (standalone), sem barra do navegador', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.display_override ?? []).not.toContain('minimal-ui');
    expect(manifest.display_override ?? []).not.toContain('browser');
  });

  it('abre preto, como a splash, sem piscar branco', () => {
    expect(manifest.background_color).toBe('#000000');
    expect(manifest.theme_color).toBe('#000000');
  });

  it('todo ícone declarado existe em public/', () => {
    for (const icon of manifest.icons) {
      expect(() => readFileSync(`public${icon.src}`)).not.toThrow();
    }
  });
});
