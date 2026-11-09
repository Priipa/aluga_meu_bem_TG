import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Unsubscribe } from 'firebase/firestore';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { ConversaService } from '../../core/conversa.service';
import { nomeDoOutro } from '../../core/conversa';
import { Conversa } from '../../core/models';

@Component({
  selector: 'app-mensagens',
  templateUrl: './mensagens.page.html',
  styleUrls: ['./mensagens.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, RouterLink],
})
export class MensagensPage implements OnDestroy {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly conversasServico = inject(ConversaService);
  private parar: Unsubscribe | null = null;

  readonly linhas = signal<LinhaConversa[]>([]);
  readonly estado = signal<'carregando' | 'lista' | 'vazio' | 'erro'>('carregando');

  constructor() {
    const uid = this.autenticacao.uid();
    if (!uid) {
      this.estado.set('erro');
      return;
    }
    this.parar = this.conversasServico.observarMinhas(
      (conversas) => {
        this.linhas.set(conversas.map((conversa) => this.linhaDe(conversa, uid)));
        this.estado.set(conversas.length ? 'lista' : 'vazio');
      },
      () => this.estado.set('erro'),
    );
  }

  ngOnDestroy(): void {
    this.parar?.();
  }

  private linhaDe(conversa: Conversa, uid: string): LinhaConversa {
    return {
      id: conversa.id,
      nome: nomeDoOutro(conversa, uid),
      titulo: conversa.tituloAnuncio,
      previa: conversa.ultimaMensagem,
      horario: conversa.atualizadoEm.toDate().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      inicial: nomeDoOutro(conversa, uid).charAt(0).toLocaleUpperCase('pt-BR'),
    };
  }
}

interface LinhaConversa {
  id: string;
  nome: string;
  titulo: string;
  previa: string;
  horario: string;
  inicial: string;
}
