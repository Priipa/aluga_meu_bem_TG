import { Injectable, inject, signal } from '@angular/core';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { StorageReference, deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  DadosFormularioAnuncio,
  prepararAnuncio,
} from './anuncio-documento';
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
