import { Injectable, inject, signal } from '@angular/core';
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { StorageReference, deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  DadosFormularioAnuncio,
  prepararAnuncio,
} from './anuncio-documento';
import { anuncioDaLeitura } from './anuncio-lista';
import { Anuncio } from './models';
import { TIPO_FOTO_PUBLICADA, caminhoFotoAnuncio, nomeFotoPublicada, validarConjuntoDeFotos } from './anuncio-fotos';
import { otimizarFoto } from './otimizar-foto';
import { AutenticacaoService } from './autenticacao.service';
import { armazenamentoFirebase, bancoFirestore } from './firebase';

const COLECAO_ANUNCIOS = 'anuncios';

@Injectable({ providedIn: 'root' })
export class AnuncioService {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly pedidosDeFormulario = signal(0);

  readonly formularioSolicitado = this.pedidosDeFormulario.asReadonly();

  solicitarFormulario(): void {
    this.pedidosDeFormulario.update((valor) => valor + 1);
  }

  /**
   * Feed da Home: anúncios ativos e disponíveis do condomínio já resolvido na sessão.
   * O id de cada item é o documentId e não é um campo do documento.
   */
  async listarDoCondominio(condominioId: string): Promise<Anuncio[]> {
    if (!condominioId) {
      return [];
    }

    const consulta = query(
      collection(bancoFirestore, COLECAO_ANUNCIOS),
      where('condominioId', '==', condominioId),
      where('status', '==', 'ativo'),
      where('disponivel', '==', true),
      orderBy('criadoEm', 'desc'),
    );
    const snapshot = await getDocs(consulta);
    const anuncios: Anuncio[] = [];
    for (const documento of snapshot.docs) {
      const anuncio = anuncioDaLeitura(documento.id, documento.data() as Record<string, unknown>);
      if (anuncio) {
        anuncios.push(anuncio);
      }
    }
    return anuncios;
  }

  /**
   * Leitura de um anúncio pelo documentId.
   * A autorização do condomínio fica nas Firestore Rules.
   */
  async obter(anuncioId: string): Promise<Anuncio | null> {
    if (!anuncioId) {
      return null;
    }
    const snapshot = await getDoc(doc(bancoFirestore, COLECAO_ANUNCIOS, anuncioId));
    if (!snapshot.exists()) {
      return null;
    }
    return anuncioDaLeitura(snapshot.id, snapshot.data() as Record<string, unknown>);
  }

  async publicar(dados: DadosFormularioAnuncio, fotos: File[]): Promise<string> {
    validarConjuntoDeFotos(fotos);
    const documento = prepararAnuncio(
      {
        uid: this.autenticacao.uid(),
        nome: this.autenticacao.perfil()?.name ?? '',
        locadorHabilitado: this.autenticacao.ehLocador(),
        situacaoVinculo: this.autenticacao.situacaoVinculo(),
        vinculo: this.autenticacao.vinculoAtivo(),
      },
      dados
    );

    const referencia = doc(collection(bancoFirestore, COLECAO_ANUNCIOS));
    const enviadas: StorageReference[] = [];
    try {
      const preparadas: Blob[] = [];
      for (const foto of fotos) {
        preparadas.push(await otimizarFoto(foto));
      }

      const imagens: string[] = [];
      for (let indice = 0; indice < preparadas.length; indice += 1) {
        const arquivo = nomeFotoPublicada(indice + 1, identificadorFoto());
        const destino = ref(
          armazenamentoFirebase,
          caminhoFotoAnuncio(documento.proprietarioId, referencia.id, arquivo),
        );
        await uploadBytes(destino, preparadas[indice], { contentType: TIPO_FOTO_PUBLICADA });
        enviadas.push(destino);
        imagens.push(await getDownloadURL(destino));
      }

      await setDoc(referencia, {
        ...documento,
        imagens,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      return referencia.id;
    } catch (erro) {
      await removerEnviadas(enviadas);
      throw erro;
    }
  }
}

function identificadorFoto(): string {
  const bruto = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return bruto.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

async function removerEnviadas(enviadas: StorageReference[]): Promise<void> {
  for (const destino of enviadas) {
    try {
      await deleteObject(destino);
    } catch (erro) {
      console.error('Falha ao remover imagem enviada', erro);
    }
  }
}
