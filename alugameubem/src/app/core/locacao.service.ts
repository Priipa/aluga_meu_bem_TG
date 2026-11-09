import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  Unsubscribe,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AutenticacaoService } from './autenticacao.service';
import { bancoFirestore } from './firebase';
import {
  COLECAO_LOCACOES,
  STATUS_ATIVOS,
  documentoDaLocacao,
  podeAlterarStatus,
  statusLocacao,
} from './locacao';
import { Anuncio, Locacao, StatusLocacao } from './models';

@Injectable({ providedIn: 'root' })
export class LocacaoService {
  private readonly autenticacao = inject(AutenticacaoService);

  async solicitar(
    anuncio: Anuncio,
    dados: { mensagem: string; inicioIso: string; fimIso: string },
  ): Promise<string> {
    const uid = this.autenticacao.uid();
    const nome = this.autenticacao.perfil()?.name ?? '';
    if (!uid) {
      throw new Error('Entre na sua conta para solicitar o aluguel.');
    }
    const documento = documentoDaLocacao({
      anuncio,
      locatarioId: uid,
      nomeLocatario: nome,
      mensagem: dados.mensagem,
      inicioIso: dados.inicioIso,
      fimIso: dados.fimIso,
    });
    const aberto = await this.temEmAberto(anuncio.id, uid);
    if (aberto) {
      throw new Error('Você já tem um aluguel em aberto para este item.');
    }
    const referencia = doc(collection(bancoFirestore, COLECAO_LOCACOES));
    await setDoc(referencia, {
      ...documento,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return referencia.id;
  }

  async alterarStatus(locacao: Locacao, status: StatusLocacao): Promise<void> {
    const uid = this.autenticacao.uid();
    if (!uid) {
      throw new Error('Entre na sua conta para atualizar o aluguel.');
    }
    if (!podeAlterarStatus(locacao, uid, status)) {
      throw new Error('Não foi possível atualizar este aluguel.');
    }
    await updateDoc(doc(bancoFirestore, COLECAO_LOCACOES, locacao.id), {
      status,
      atualizadoEm: serverTimestamp(),
    });
  }

  observarMinhas(
    aoMudar: (locacoes: Locacao[]) => void,
    aoErro: () => void,
  ): Unsubscribe {
    const uid = this.autenticacao.uid();
    if (!uid) {
      aoMudar([]);
      return () => undefined;
    }
    const consulta = query(
      collection(bancoFirestore, COLECAO_LOCACOES),
      where('participantes', 'array-contains', uid),
      orderBy('criadoEm', 'desc'),
    );
    return onSnapshot(
      consulta,
      (snapshot) => {
        const locacoes: Locacao[] = [];
        for (const documento of snapshot.docs) {
          const locacao = locacaoDaLeitura(documento.id, documento.data() as Record<string, unknown>);
          if (locacao) {
            locacoes.push(locacao);
          }
        }
        aoMudar(locacoes);
      },
      () => aoErro(),
    );
  }

  async temEmAberto(anuncioId: string, locatarioId: string): Promise<boolean> {
    for (const status of STATUS_ATIVOS) {
      const consulta = query(
        collection(bancoFirestore, COLECAO_LOCACOES),
        where('anuncioId', '==', anuncioId),
        where('locatarioId', '==', locatarioId),
        where('status', '==', status),
      );
      const snapshot = await getDocs(consulta);
      if (!snapshot.empty) {
        return true;
      }
    }
    return false;
  }
}

function locacaoDaLeitura(id: string, dados: Record<string, unknown>): Locacao | null {
  const anuncioId = dados['anuncioId'];
  const condominioId = dados['condominioId'];
  const locadorId = dados['locadorId'];
  const locatarioId = dados['locatarioId'];
  const tituloAnuncio = dados['tituloAnuncio'];
  const categoriaAnuncio = dados['categoriaAnuncio'];
  const capaAnuncio = dados['capaAnuncio'];
  const nomeLocador = dados['nomeLocador'];
  const nomeLocatario = dados['nomeLocatario'];
  const mensagem = dados['mensagem'];
  const inicioIso = dados['inicioIso'];
  const fimIso = dados['fimIso'];
  const dias = dados['dias'];
  const valorDiaria = dados['valorDiaria'];
  const valorTotal = dados['valorTotal'];
  const status = dados['status'];
  const criadoEm = dados['criadoEm'];
  const atualizadoEm = dados['atualizadoEm'];
  const participantes = participantesDaLeitura(dados['participantes']);
  if (!id || !participantes || !statusLocacao(status)) {
    return null;
  }
  if (
    typeof anuncioId !== 'string' ||
    typeof condominioId !== 'string' ||
    typeof locadorId !== 'string' ||
    typeof locatarioId !== 'string' ||
    typeof tituloAnuncio !== 'string' ||
    typeof categoriaAnuncio !== 'string' ||
    typeof capaAnuncio !== 'string' ||
    typeof nomeLocador !== 'string' ||
    typeof nomeLocatario !== 'string' ||
    typeof mensagem !== 'string' ||
    typeof inicioIso !== 'string' ||
    typeof fimIso !== 'string'
  ) {
    return null;
  }
  if (
    typeof dias !== 'number' ||
    !Number.isFinite(dias) ||
    typeof valorDiaria !== 'number' ||
    !Number.isFinite(valorDiaria) ||
    typeof valorTotal !== 'number' ||
    !Number.isFinite(valorTotal)
  ) {
    return null;
  }
  if (!(criadoEm instanceof Timestamp) || !(atualizadoEm instanceof Timestamp)) {
    return null;
  }
  return {
    id,
    anuncioId,
    condominioId,
    locadorId,
    locatarioId,
    participantes,
    tituloAnuncio,
    categoriaAnuncio,
    capaAnuncio,
    nomeLocador,
    nomeLocatario,
    mensagem,
    inicioIso,
    fimIso,
    dias,
    valorDiaria,
    valorTotal,
    status,
    criadoEm,
    atualizadoEm,
  };
}

function participantesDaLeitura(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || valor.length !== 2) {
    return null;
  }
  const participantes: string[] = [];
  for (const item of valor) {
    if (typeof item !== 'string' || item.length === 0) {
      return null;
    }
    participantes.push(item);
  }
  return participantes;
}
