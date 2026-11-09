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
import {
  bagHandleOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircle,
  close,
  locationOutline,
  returnDownBackOutline,
} from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { idConversa } from '../../core/conversa';
import {
  descricaoGestaoLocacao,
  ehStatusAtivo,
  ehStatusEncerrado,
  formatarPeriodo,
  primeiroNome,
  rotuloStatusLocacao,
} from '../../core/locacao';
import { LocacaoService } from '../../core/locacao.service';
import { Locacao, StatusLocacao } from '../../core/models';

type AbaAluguel = 'ativos' | 'encerrados';

@Component({
  selector: 'app-meus-alugueis',
  templateUrl: './meus-alugueis.page.html',
  styleUrls: ['./meus-alugueis.page.scss'],
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
export class MeusAlugueisPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly locacoesServico = inject(LocacaoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  readonly ehLocador = this.autenticacao.ehLocador;
  readonly aba = signal<AbaAluguel>('ativos');
  readonly locacoes = signal<Locacao[]>([]);
  readonly estado = signal<'carregando' | 'lista' | 'erro'>('carregando');
  readonly alterandoId = signal<string | null>(null);
  readonly aviso = signal('');
  readonly rotulo = rotuloStatusLocacao;
  readonly periodo = formatarPeriodo;
  readonly descricao = descricaoGestaoLocacao;
  readonly primeiroNome = primeiroNome;

  readonly meus = computed(() => {
    const uid = this.autenticacao.uid();
    return this.locacoes().filter((item) => item.locatarioId === uid);
  });
  readonly ativos = computed(() => this.meus().filter((item) => ehStatusAtivo(item.status)));
  readonly encerrados = computed(() => this.meus().filter((item) => ehStatusEncerrado(item.status)));
  readonly visiveis = computed(() => (this.aba() === 'ativos' ? this.ativos() : this.encerrados()));
  readonly pendentesRecebidas = computed(
    () =>
      this.locacoes().filter(
        (item) => item.locadorId === this.autenticacao.uid() && item.status === 'pendente',
      ).length,
  );

  constructor() {
    addIcons({
      bagHandleOutline,
      calendarOutline,
      chatbubbleOutline,
      checkmarkCircle,
      close,
      locationOutline,
      returnDownBackOutline,
    });
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

  escolherAba(aba: AbaAluguel): void {
    this.aba.set(aba);
    void this.router.navigate([], {
      relativeTo: this.rota,
      queryParams: { aba },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  classeSelo(status: StatusLocacao): string {
    if (status === 'em_andamento' || status === 'concluido') {
      return 'ok';
    }
    if (status === 'recusado' || status === 'cancelado') {
      return 'nao';
    }
    return '';
  }

  async cancelar(locacao: Locacao): Promise<void> {
    await this.alterar(locacao, 'cancelado');
  }

  async confirmarRetirada(locacao: Locacao): Promise<void> {
    await this.alterar(locacao, 'em_andamento');
  }

  async confirmarDevolucao(locacao: Locacao): Promise<void> {
    await this.alterar(locacao, 'concluido');
  }

  abrirChat(locacao: Locacao): void {
    void this.router.navigate(['/chat', idConversa(locacao.anuncioId, locacao.locatarioId)]);
  }

  private aplicarAbaDaRota(): void {
    const aba = this.rota.snapshot.queryParamMap.get('aba');
    if (aba === 'encerrados' || aba === 'ativos') {
      this.aba.set(aba);
    }
  }

  private async alterar(locacao: Locacao, status: StatusLocacao): Promise<void> {
    if (this.alterandoId()) {
      return;
    }
    this.alterandoId.set(locacao.id);
    this.aviso.set('');
    try {
      await this.locacoesServico.alterarStatus(locacao, status);
      if (status === 'concluido' || status === 'cancelado') {
        this.aba.set('encerrados');
      }
    } catch (erro) {
      console.error('Falha ao atualizar aluguel', erro);
      this.aviso.set('Não foi possível atualizar este aluguel.');
    } finally {
      this.alterandoId.set(null);
    }
  }
}
