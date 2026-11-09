import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { add, pauseOutline, playOutline, trashOutline } from 'ionicons/icons';
import { AnuncioService } from '../../core/anuncio.service';
import { anunciosComStatus, rotuloStatus } from '../../core/anuncio-lista';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { Anuncio, StatusAnuncio } from '../../core/models';

type AbaAnuncio = StatusAnuncio;
type EstadoTela = 'sessao' | 'carregando' | 'erro' | 'lista';

@Component({
  selector: 'app-meus-anuncios',
  templateUrl: './meus-anuncios.page.html',
  styleUrls: ['./meus-anuncios.page.scss'],
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
export class MeusAnunciosPage {
  private readonly anunciosServico = inject(AnuncioService);
  private readonly autenticacao = inject(AutenticacaoService);
  private geracao = 0;

  readonly aba = signal<AbaAnuncio>('ativo');
  readonly rotuloStatus = rotuloStatus;
  private readonly anuncios = signal<Anuncio[]>([]);
  private readonly carregando = signal(false);
  private readonly erro = signal(false);
  private readonly capasComFalha = signal<ReadonlySet<string>>(new Set());
  readonly alterandoId = signal<string | null>(null);
  readonly aviso = signal('');

  readonly ativos = computed(() => anunciosComStatus(this.anuncios(), 'ativo'));
  readonly pausados = computed(() => anunciosComStatus(this.anuncios(), 'pausado'));
  readonly excluidos = computed(() => anunciosComStatus(this.anuncios(), 'arquivado'));
  readonly visiveis = computed(() => anunciosComStatus(this.anuncios(), this.aba()));

  readonly estado = computed((): EstadoTela => {
    if (this.autenticacao.carregandoSessao()) {
      return 'sessao';
    }
    if (this.erro()) {
      return 'erro';
    }
    if (this.carregando()) {
      return 'carregando';
    }
    return 'lista';
  });

  constructor() {
    addIcons({ add, pauseOutline, playOutline, trashOutline });
    effect(() => {
      const uid = this.autenticacao.uid();
      const locador = this.autenticacao.ehLocador();
      const geracao = ++this.geracao;
      if (!uid || !locador) {
        this.anuncios.set([]);
        this.carregando.set(false);
        this.erro.set(false);
        return;
      }
      void this.carregar(geracao);
    });
  }

  ionViewWillEnter(): void {
    if (this.autenticacao.uid() && this.autenticacao.ehLocador()) {
      void this.carregar(++this.geracao);
    }
  }

  escolherAba(aba: AbaAnuncio): void {
    this.aba.set(aba);
  }

  capaVisivel(anuncio: Anuncio): boolean {
    const url = anuncio.imagens[0];
    return typeof url === 'string' && url.length > 0 && !this.capasComFalha().has(anuncio.id);
  }

  registrarFalhaDaCapa(id: string): void {
    this.capasComFalha.update((atual) => {
      if (atual.has(id)) {
        return atual;
      }
      const proximo = new Set(atual);
      proximo.add(id);
      return proximo;
    });
  }

  async pausar(anuncio: Anuncio, evento: Event): Promise<void> {
    evento.preventDefault();
    evento.stopPropagation();
    await this.mudarStatus(anuncio.id, 'pausado');
  }

  async ativar(anuncio: Anuncio, evento: Event): Promise<void> {
    evento.preventDefault();
    evento.stopPropagation();
    await this.mudarStatus(anuncio.id, 'ativo');
  }

  async excluir(anuncio: Anuncio, evento: Event): Promise<void> {
    evento.preventDefault();
    evento.stopPropagation();
    await this.mudarStatus(anuncio.id, 'arquivado');
  }

  private async mudarStatus(id: string, status: StatusAnuncio): Promise<void> {
    if (this.alterandoId()) {
      return;
    }
    this.alterandoId.set(id);
    this.aviso.set('');
    try {
      await this.anunciosServico.alterarStatus(id, status);
      this.anuncios.update((lista) =>
        lista.map((item) =>
          item.id === id ? { ...item, status, disponivel: status === 'ativo' } : item,
        ),
      );
    } catch (erro) {
      console.error('Falha ao atualizar anúncio', erro);
      this.aviso.set('Não foi possível atualizar este anúncio.');
    } finally {
      this.alterandoId.set(null);
    }
  }

  private async carregar(geracao: number): Promise<void> {
    this.carregando.set(true);
    this.erro.set(false);
    try {
      const lista = await this.anunciosServico.listarDoLocador();
      if (geracao !== this.geracao) {
        return;
      }
      this.anuncios.set(lista);
    } catch (erro) {
      if (geracao !== this.geracao) {
        return;
      }
      console.error('Falha ao ler anúncios do locador', erro);
      this.anuncios.set([]);
      this.erro.set(true);
    } finally {
      if (geracao === this.geracao) {
        this.carregando.set(false);
      }
    }
  }
}
