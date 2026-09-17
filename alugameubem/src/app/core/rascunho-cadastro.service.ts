import { Injectable } from '@angular/core';
import { CondominioOpcao } from './models';

export interface ValoresRascunhoCadastro {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  phone: string;
  condominioId: string;
  bloco: string;
  apartamento: string;
  aceitaTermos: boolean;
}

export interface RascunhoCadastro {
  etapa: 1 | 2;
  valores: ValoresRascunhoCadastro;
  condominios: CondominioOpcao[];
}

/**
 * Rascunho apenas em memória (singleton).
 * Não usa localStorage, sessionStorage, URL nem Firestore.
 */
@Injectable({ providedIn: 'root' })
export class RascunhoCadastroService {
  private rascunho: RascunhoCadastro | null = null;

  salvar(rascunho: RascunhoCadastro): void {
    this.rascunho = {
      etapa: rascunho.etapa,
      valores: { ...rascunho.valores },
      condominios: [...rascunho.condominios],
    };
  }

  ler(): RascunhoCadastro | null {
    return this.rascunho;
  }

  existe(): boolean {
    return this.rascunho !== null;
  }

  limpar(): void {
    this.rascunho = null;
  }
}
