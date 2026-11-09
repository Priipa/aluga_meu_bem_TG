import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Unsubscribe } from 'firebase/firestore';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { CatalogoService } from '../../core/catalogo.service';
import { ContextoChat, ConversaService } from '../../core/conversa.service';
import { ChatMessage, MensagemConversa } from '../../core/models';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    FormsModule,
  ],
})
export class ChatPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly conversas = inject(ConversaService);
  private readonly autenticacao = inject(AutenticacaoService);
  readonly id = input.required<string>();
  readonly item = computed(() => this.catalogo.find(this.id()));
  readonly messages = signal<ChatMessage[]>([]);
  readonly titulo = signal('Chat');
  readonly subtitulo = signal('');
  readonly estado = signal<'carregando' | 'ok' | 'erro'>('carregando');
  readonly aviso = signal('');
  readonly enviando = signal(false);
  draft = '';
  private contexto: ContextoChat | null = null;
  private pararMensagens: Unsubscribe | null = null;

  constructor() {
    addIcons({ send });
    effect((onCleanup) => {
      const id = this.id();
      const mock = this.catalogo.find(id);
      this.draft = '';
      this.aviso.set('');
      this.contexto = null;
      this.pararOuvir();

      if (mock) {
        this.titulo.set(mock.owner.name);
        this.subtitulo.set(mock.title);
        this.messages.set([...this.catalogo.mensagensDe(id)]);
        this.estado.set('ok');
        return;
      }

      this.titulo.set('Chat');
      this.subtitulo.set('');
      this.messages.set([]);
      this.estado.set('carregando');
      let ativo = true;
      void this.conversas.abrir(id).then(
        (contexto) => {
          if (!ativo) {
            return;
          }
          this.contexto = contexto;
          this.titulo.set(contexto.nomeOutro);
          this.subtitulo.set(contexto.tituloAnuncio);
          this.estado.set('ok');
          if (contexto.conversa) {
            this.ouvirMensagens(id);
          }
        },
        (erro) => {
          if (!ativo) {
            return;
          }
          this.aviso.set(mensagemDoErro(erro));
          this.estado.set('erro');
        },
      );
      onCleanup(() => {
        ativo = false;
        this.pararOuvir();
      });
    });
  }

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.enviando()) {
      return;
    }
    const mock = this.item();
    if (mock) {
      this.messages.update((list) => [...list, { fromMe: true, text, time: 'agora' }]);
      this.draft = '';
      return;
    }
    const contexto = this.contexto;
    if (!contexto) {
      return;
    }
    this.enviando.set(true);
    this.aviso.set('');
    void this.conversas
      .enviar(contexto, text)
      .then(() => {
        this.draft = '';
        if (!this.pararMensagens) {
          this.ouvirMensagens(contexto.conversaId);
        }
      })
      .catch((erro) => {
        this.aviso.set(mensagemDoErro(erro));
      })
      .finally(() => {
        this.enviando.set(false);
      });
  }

  private ouvirMensagens(conversaId: string): void {
    this.pararOuvir();
    this.pararMensagens = this.conversas.observarMensagens(conversaId, (mensagens) => {
      this.messages.set(mensagens.map((mensagem) => this.paraExibicao(mensagem)));
    });
  }

  private pararOuvir(): void {
    this.pararMensagens?.();
    this.pararMensagens = null;
  }

  private paraExibicao(mensagem: MensagemConversa): ChatMessage {
    return {
      fromMe: mensagem.autorId === this.autenticacao.uid(),
      text: mensagem.texto,
      time: horarioDaMensagem(mensagem.criadoEm),
    };
  }
}

function horarioDaMensagem(valor: MensagemConversa['criadoEm']): string {
  if (!valor) {
    return 'agora';
  }
  return valor.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String((erro as { code: string }).code) : '';
  if (codigo === 'permission-denied') {
    return 'Não foi possível enviar a mensagem.';
  }
  if (erro instanceof Error && erro.message && !codigo) {
    return erro.message;
  }
  return 'Não foi possível enviar a mensagem. Tente novamente.';
}
