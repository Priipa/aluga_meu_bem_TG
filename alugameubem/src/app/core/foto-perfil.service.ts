import { Injectable, inject } from '@angular/core';
import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage';
import { TIPO_FOTO_PUBLICADA, selecionarFotoPerfil } from './anuncio-fotos';
import { AutenticacaoService } from './autenticacao.service';
import { caminhoFotoPerfil, fotoPerfilDoUsuario, identificadorFotoPerfil } from './foto-perfil';
import { armazenamentoFirebase, bancoFirestore } from './firebase';
import { otimizarFoto } from './otimizar-foto';

const COLECAO_USUARIOS = 'usuarios';

@Injectable({ providedIn: 'root' })
export class FotoPerfilService {
  private readonly autenticacao = inject(AutenticacaoService);

  /** `null` remove a foto já salva. A anterior só sai depois da nova referência. */
  async aplicar(arquivo: File | null): Promise<void> {
    const uid = this.autenticacao.uid();
    const anterior = this.autenticacao.perfil()?.fotoPerfil ?? null;
    if (!uid) {
      throw this.erro('perfil/nao-carregado');
    }

    if (!arquivo) {
      if (!anterior) {
        return;
      }
      await updateDoc(doc(bancoFirestore, COLECAO_USUARIOS, uid), {
        fotoPerfil: deleteField(),
        atualizadoEm: serverTimestamp(),
      });
      this.autenticacao.definirFotoPerfil(null);
      await this.removerArquivo(anterior);
      return;
    }

    const selecao = selecionarFotoPerfil(arquivo);
    if (!selecao.aceita) {
      throw new Error(selecao.mensagem || 'Não foi possível preparar a foto.');
    }

    const preparada = await otimizarFoto(arquivo);
    const caminho = caminhoFotoPerfil(uid, identificadorFotoPerfil());
    const destino = ref(armazenamentoFirebase, caminho);
    let enviou = false;
    try {
      await uploadBytes(destino, preparada, { contentType: TIPO_FOTO_PUBLICADA });
      enviou = true;
      await updateDoc(doc(bancoFirestore, COLECAO_USUARIOS, uid), {
        fotoPerfil: caminho,
        atualizadoEm: serverTimestamp(),
      });
    } catch (erro) {
      if (enviou) {
        await this.removerArquivo(caminho);
      }
      throw erro;
    }

    this.autenticacao.definirFotoPerfil(caminho);
    if (anterior && anterior !== caminho) {
      await this.removerArquivo(anterior);
    }
  }

  async abrir(caminho: string): Promise<string> {
    const uid = this.autenticacao.uid();
    if (!uid || !fotoPerfilDoUsuario(caminho, uid)) {
      throw new Error('Não foi possível carregar a foto.');
    }
    const blob = await getBlob(ref(armazenamentoFirebase, caminho));
    return URL.createObjectURL(blob);
  }

  private async removerArquivo(caminho: string): Promise<void> {
    const uid = this.autenticacao.uid();
    if (!uid || !fotoPerfilDoUsuario(caminho, uid)) {
      return;
    }
    try {
      await deleteObject(ref(armazenamentoFirebase, caminho));
    } catch (erro) {
      console.error('Falha ao remover foto de perfil substituída', erro);
    }
  }

  private erro(codigo: string): Error {
    const falha = new Error(codigo);
    Object.assign(falha, { code: codigo });
    return falha;
  }
}
