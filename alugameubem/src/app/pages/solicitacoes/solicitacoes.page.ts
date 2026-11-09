import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, chatbubbleOutline, checkmarkCircle, close, locationOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { idConversa } from '../../core/conversa';
import { formatarPeriodo, primeiroNome, rotuloRetirada, rotuloStatusLocacao } from '../../core/locacao';
import { LocacaoService } from '../../core/locacao.service';
import { Locacao } from '../../core/models';

type AbaSolicitacao = 'recebidas' | 'enviadas';

@Component({
  selector: 'app-solicitacoes',
  templateUrl: './solicitacoes.page.html',
  styleUrls: ['./solicitacoes.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    RouterLink,
    CurrencyPipe,
  ],
})
export class SolicitacoesPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly locacoesServico = inject(LocacaoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  readonly ehLocador = this.autenticacao.ehLocador;
  readonly aba = signal<AbaSolicitacao>('recebidas');
  readonly locacoes = signal<Locacao[]>([]);
  readonly estado = signal<'carregando' | 'lista' | 'erro'>('carregando');
  readonly respondendoId = signal<string | null>(null);
  readonly aviso = signal('');
  readonly rotulo = rotuloStatusLocacao;
  readonly periodo = formatarPeriodo;
  readonly retirada = rotuloRetirada;
  readonly primeiroNome = primeiroNome;

  readonly recebidas = computed(() => {
    const uid = this.autenticacao.uid();
    return this.locacoes().filter((item) => item.locadorId === uid);
  });
  readonly enviadas = computed(() => {
    const uid = this.autenticacao.uid();
    return this.locacoes().filter((item) => item.locatarioId === uid);
  });
  readonly visiveis = computed(() => (this.aba() === 'recebidas' ? this.recebidas() : this.enviadas()));
  readonly pendentesRecebidas = computed(
    () => this.recebidas().filter((item) => item.status === 'pendente').length,
  );

  constructor() {
    addIcons({ calendarOutline, chatbubbleOutline, checkmarkCircle, close, locationOutline });
    this.aplicarAbaDaRota();
    effect((onCleanup) => {
      const uid = this.autenticacao.uid();
      if (this.autenticacao.carregandoSessao()) {
        this.estado.set('carregando');
        return;
      }
      if (!uid) {
        this.locacoes.set([]);
        this.estado.set('lista');
        return;
      }
      this.estado.set('carregando');
      const parar = this.locacoesServico.observarMinhas(
        (lista) => {
          this.locacoes.set(lista);
          this.estado.set('lista');
        },
        () => this.estado.set('erro'),
      );
      onCleanup(() => parar());
    });
  }

  ionViewWillEnter(): void {
    this.aplicarAbaDaRota();
  }

  escolherAba(aba: AbaSolicitacao): void {
    this.aba.set(aba);
    void this.router.navigate([], {
      relativeTo: this.rota,
      queryParams: { aba },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  inicial(nome: string): string {
    return nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
  }

  nomeDaLinha(locacao: Locacao): string {
    return this.aba() === 'recebidas' ? locacao.nomeLocatario : locacao.nomeLocador;
  }

  async aceitar(locacao: Locacao): Promise<void> {
    await this.responder(locacao, 'aprovado');
  }

  async recusar(locacao: Locacao): Promise<void> {
    await this.responder(locacao, 'recusado');
  }

  async confirmarRetirada(locacao: Locacao): Promise<void> {
    await this.responder(locacao, 'em_andamento');
  }

  async confirmarDevolucao(locacao: Locacao): Promise<void> {
    await this.responder(locacao, 'concluido');
  }

  abrirChat(locacao: Locacao): void {
    void this.router.navigate(['/chat', idConversa(locacao.anuncioId, locacao.locatarioId)]);
  }

  abrirAlugueis(): void {
    void this.router.navigate(['/tabs/alugueis']);
  }

  private aplicarAbaDaRota(): void {
    const aba = this.rota.snapshot.queryParamMap.get('aba');
    if (aba === 'enviadas' || aba === 'recebidas') {
      this.aba.set(aba);
      return;
    }
    if (!this.autenticacao.carregandoSessao() && !this.ehLocador()) {
      this.aba.set('enviadas');
    }
  }

  private async responder(locacao: Locacao, status: Locacao['status']): Promise<void> {
    if (this.respondendoId()) {
      return;
    }
    this.respondendoId.set(locacao.id);
    this.aviso.set('');
    try {
      await this.locacoesServico.alterarStatus(locacao, status);
    } catch (erro) {
      console.error('Falha ao responder solicitação', erro);
      this.aviso.set('Não foi possível atualizar esta solicitação.');
    } finally {
      this.respondendoId.set(null);
    }
  }
}
