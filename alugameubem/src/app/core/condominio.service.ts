import { Injectable } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { bancoFirestore } from './firebase';
import { CondominioOpcao } from './models';

const COLECAO_CONDOMINIOS = 'condominios';

@Injectable({ providedIn: 'root' })
export class CondominioService {
  async listarAtivos(): Promise<CondominioOpcao[]> {
    const consulta = query(
      collection(bancoFirestore, COLECAO_CONDOMINIOS),
      where('status', '==', 'ativo')
    );
    const snapshot = await getDocs(consulta);

    return snapshot.docs
      .map((documento) => {
        const dados = documento.data();
        const local = extrairLocal(dados['endereco']);
        return {
          id: documento.id,
          nome: textoCampo(dados['nome']),
          cidade: local.cidade,
          bairro: local.bairro,
        };
      })
      .filter((opcao) => opcao.nome.length > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
}

function textoCampo(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function extrairLocal(endereco: unknown): { cidade: string; bairro: string } {
  if (!endereco || typeof endereco !== 'object') {
    return { cidade: '', bairro: '' };
  }
  const mapa = endereco as Record<string, unknown>;
  return {
    cidade: textoCampo(mapa['cidade']),
    bairro: textoCampo(mapa['bairro']),
  };
}
