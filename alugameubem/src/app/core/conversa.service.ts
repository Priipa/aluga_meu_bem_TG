import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  Unsubscribe,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { AnuncioService } from './anuncio.service';
import { AutenticacaoService } from './autenticacao.service';
import {
  COLECAO_CONVERSAS,
  SUBCOLECAO_MENSAGENS,
  documentoDaConversa,
  mensagemValida,
  nomeDoOutro,
  partesDaConversa,
} from './conversa';
import { bancoFirestore } from './firebase';
import { Anuncio, Conversa, MensagemConversa } from './models';

export interface ContextoChat {
  conversaId: string;
  anuncio: Anuncio;
  conversa: Conversa | null;
  nomeOutro: string;
  tituloAnuncio: string;
}

@Injectable({ providedIn: 'root' })
export class ConversaService {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly anuncios = inject(AnuncioService);

  async abrir(conversaId: string): Promise<ContextoChat> {
    const uid = this.autenticacao.uid();
    const partes = partesDaConversa(conversaId);
    if (!uid || !partes) {
      throw new Error('Não foi possível abrir esta conversa.');
    }

    const lida = await this.lerConversa(conversaId);
    if (lida) {
      if (!lida.participantes.includes(uid)) {
        throw new Error('Não foi possível abrir esta conversa.');
      }
      const anuncio = await this.anuncios.obter(lida.anuncioId);
      if (!anuncio) {
        throw new Error('Não foi possível abrir este anúncio.');
      }
      return {
        conversaId,
        anuncio,
        conversa: lida,
        nomeOutro: nomeDoOutro(lida, uid),
        tituloAnuncio: lida.tituloAnuncio,
      };
    }

    const anuncio = await this.anuncios.obter(partes.anuncioId);
    if (!anuncio) {
      throw new Error('Não foi possível abrir este anúncio.');
    }
    if (partes.interessadoId === uid && anuncio.proprietarioId !== uid) {
      return {
        conversaId,
        anuncio,
        conversa: null,
        nomeOutro: anuncio.nomeExibicao,
        tituloAnuncio: anuncio.titulo,
      };
    }
    if (anuncio.proprietarioId === uid && partes.interessadoId !== uid) {
      return {
        conversaId,
        anuncio,
        conversa: null,
        nomeOutro: 'Locatário',
        tituloAnuncio: anuncio.titulo,
      };
    }
    throw new Error('Não foi possível abrir esta conversa.');
  }

  async enviar(contexto: ContextoChat, textoBruto: unknown): Promise<void> {
    const uid = this.autenticacao.uid();
    const nome = this.autenticacao.perfil()?.name ?? '';
    if (!uid) {
      throw new Error('Entre na sua conta para enviar uma mensagem.');
    }
    const texto = mensagemValida(textoBruto);
    const referencia = doc(bancoFirestore, COLECAO_CONVERSAS, contexto.conversaId);
    const mensagemRef = doc(collection(referencia, SUBCOLECAO_MENSAGENS));
    const lote = writeBatch(bancoFirestore);
    const existente = await getDoc(referencia);
    if (existente.exists()) {
      lote.update(referencia, {
        ultimaMensagem: texto,
        atualizadoEm: serverTimestamp(),
      });
    } else {
      const partes = partesDaConversa(contexto.conversaId);
      if (!partes || (uid !== partes.interessadoId && uid !== contexto.anuncio.proprietarioId)) {
        throw new Error('Não foi possível iniciar esta conversa.');
      }
      lote.set(referencia, {
        ...documentoDaConversa({
          anuncio: contexto.anuncio,
          interessadoId: partes.interessadoId,
          nomeInteressado: uid === partes.interessadoId ? nome : contexto.nomeOutro,
          texto,
        }),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    }
    lote.set(mensagemRef, {
      autorId: uid,
      texto,
      criadoEm: serverTimestamp(),
    });
    await lote.commit();
  }

  private async lerConversa(conversaId: string): Promise<Conversa | null> {
    const snapshot = await getDoc(doc(bancoFirestore, COLECAO_CONVERSAS, conversaId));
    if (!snapshot.exists()) {
      return null;
    }
    return conversaDaLeitura(snapshot.id, snapshot.data() as Record<string, unknown>);
  }

  observarMensagens(conversaId: string, aoMudar: (mensagens: MensagemConversa[]) => void): Unsubscribe {
    const consulta = query(
      collection(bancoFirestore, COLECAO_CONVERSAS, conversaId, SUBCOLECAO_MENSAGENS),
      orderBy('criadoEm', 'asc'),
    );
    return onSnapshot(
      consulta,
      (snapshot) => {
        const mensagens: MensagemConversa[] = [];
        for (const documento of snapshot.docs) {
          const mensagem = mensagemDaLeitura(documento.id, documento.data() as Record<string, unknown>);
          if (mensagem) {
            mensagens.push(mensagem);
          }
        }
        aoMudar(mensagens);
      },
      () => aoMudar([]),
    );
  }

  observarMinhas(
    aoMudar: (conversas: Conversa[]) => void,
    aoErro: () => void,
  ): Unsubscribe {
    const uid = this.autenticacao.uid();
    if (!uid) {
      aoMudar([]);
      return () => undefined;
    }
    const consulta = query(
      collection(bancoFirestore, COLECAO_CONVERSAS),
      where('participantes', 'array-contains', uid),
      orderBy('atualizadoEm', 'desc'),
    );
    return onSnapshot(
      consulta,
      (snapshot) => {
        const conversas: Conversa[] = [];
        for (const documento of snapshot.docs) {
          const conversa = conversaDaLeitura(documento.id, documento.data() as Record<string, unknown>);
          if (conversa) {
            conversas.push(conversa);
          }
        }
        aoMudar(conversas);
      },
      () => aoErro(),
    );
  }
}

function conversaDaLeitura(id: string, dados: Record<string, unknown>): Conversa | null {
  const anuncioId = dados['anuncioId'];
  const condominioId = dados['condominioId'];
  const proprietarioId = dados['proprietarioId'];
  const interessadoId = dados['interessadoId'];
  const tituloAnuncio = dados['tituloAnuncio'];
  const nomeProprietario = dados['nomeProprietario'];
  const nomeInteressado = dados['nomeInteressado'];
  const ultimaMensagem = dados['ultimaMensagem'];
  const criadoEm = dados['criadoEm'];
  const atualizadoEm = dados['atualizadoEm'];
  const participantes = participantesDaLeitura(dados['participantes']);
  if (!id || !participantes) {
    return null;
  }
  if (
    typeof anuncioId !== 'string' ||
    typeof condominioId !== 'string' ||
    typeof proprietarioId !== 'string' ||
    typeof interessadoId !== 'string' ||
    typeof tituloAnuncio !== 'string' ||
    typeof nomeProprietario !== 'string' ||
    typeof nomeInteressado !== 'string' ||
    typeof ultimaMensagem !== 'string'
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
    proprietarioId,
    interessadoId,
    participantes,
    tituloAnuncio,
    nomeProprietario,
    nomeInteressado,
    ultimaMensagem,
    criadoEm,
    atualizadoEm,
  };
}

function mensagemDaLeitura(id: string, dados: Record<string, unknown>): MensagemConversa | null {
  const autorId = dados['autorId'];
  const texto = dados['texto'];
  const criadoEm = dados['criadoEm'];
  if (!id || typeof autorId !== 'string' || typeof texto !== 'string') {
    return null;
  }
  if (criadoEm !== undefined && criadoEm !== null && !(criadoEm instanceof Timestamp)) {
    return null;
  }
  return {
    id,
    autorId,
    texto,
    criadoEm: criadoEm instanceof Timestamp ? criadoEm : null,
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
