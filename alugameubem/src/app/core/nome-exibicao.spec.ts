import { describe, expect, it } from 'vitest';
import { nomeExibicao } from './nome-exibicao';

describe('nomeExibicao', () => {
  it('usa o primeiro nome e a inicial do último sobrenome', () => {
    expect(nomeExibicao('Giovanna Priscila Nascimento')).toBe('Giovanna N.');
    expect(nomeExibicao('Maria Ferreira')).toBe('Maria F.');
  });

  it('mantém um único nome', () => {
    expect(nomeExibicao('Maria')).toBe('Maria');
  });

  it('ignora espaços extras', () => {
    expect(nomeExibicao('  Ana   Souza  ')).toBe('Ana S.');
  });

  it('não inventa nome quando o texto está vazio', () => {
    expect(nomeExibicao('   ')).toBe('');
  });
});
