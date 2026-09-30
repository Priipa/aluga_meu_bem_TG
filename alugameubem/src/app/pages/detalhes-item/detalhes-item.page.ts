import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, chevronBackOutline, chevronForwardOutline, heart, heartOutline, shareOutline, star, locationOutline, checkmarkCircle } from 'ionicons/icons';
import { AnuncioService } from '../../core/anuncio.service';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { CatalogoService } from '../../core/catalogo.service';
import { Anuncio } from '../../core/models';

type EstadoReal =
  | 'sessao'
  | 'visitante'
  | 'ausente'
  | 'inconsistente'
  | 'erro-vinculo'
  | 'carregando'
  | 'carregado'
  | 'inacessivel'
  | 'erro';

type FalhaReal = 'inacessivel' | 'erro';

@Component({
  selector: 'app-detalhes-item',
  templateUrl: './detalhes-item.page.html',
  styleUrls: ['./detalhes-item.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonIcon,
    RouterLink,
    CurrencyPipe,
  ],
})
export class DetalhesItemPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly anuncios = inject(AnuncioService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  private geracaoReal = 0;
  private ultimoId = '';

  readonly id = input.required<string>();
  readonly imageIndex = signal(0);
  readonly item = computed(() => this.catalogo.find(this.id()));
  readonly days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  readonly calendar = this.buildCalendar();

  private readonly anuncio = signal<Anuncio | null>(null);
  private readonly carregandoAnuncio = signal(false);
  private readonly leituraPronta = signal(false);
  private readonly falha = signal<FalhaReal | null>(null);
  private readonly fotoComFalha = signal<number | null>(null);
  private readonly favTick = signal(0);

  readonly anuncioReal = this.anuncio.asReadonly();

  readonly estadoReal = computed((): EstadoReal => {
    if (this.autenticacao.carregandoSessao()) {
      return 'sessao';
    }
    if (!this.autenticacao.autenticado()) {
      return 'visitante';
    }
    const situacao = this.autenticacao.situacaoVinculo();
    if (situacao === 'ausente') {
      return 'ausente';
    }
    if (situacao === 'inconsistente') {
      return 'inconsistente';
    }
    if (situacao !== 'unico' || !this.autenticacao.condominioId()) {
      return 'erro-vinculo';
    }
    if (this.falha() === 'inacessivel') {
      return 'inacessivel';
    }
    if (this.falha() === 'erro') {
      return 'erro';
    }
    if (this.carregandoAnuncio() || !this.leituraPronta()) {
      return 'carregando';
    }
    if (!this.anuncio()) {
      return 'inacessivel';
    }
    return 'carregado';
  });

  constructor() {
    addIcons({
      arrowBack,
      chevronBackOutline,
      chevronForwardOutline,
      heart,
      heartOutline,
      shareOutline,
      star,
      locationOutline,
      checkmarkCircle,
    });
    effect(() => {
      const id = this.id();
      const mock = this.catalogo.find(id);
      const carregandoSessao = this.autenticacao.carregandoSessao();
      const autenticado = this.autenticacao.autenticado();
      const situacao = this.autenticacao.situacaoVinculo();
      const condominioId = this.autenticacao.condominioId();
      const geracao = ++this.geracaoReal;

      if (id !== this.ultimoId) {
        this.ultimoId = id;
        this.imageIndex.set(0);
        this.fotoComFalha.set(null);
      }

      if (mock || carregandoSessao || !autenticado || situacao !== 'unico' || !condominioId) {
        this.anuncio.set(null);
        this.carregandoAnuncio.set(false);
        this.leituraPronta.set(false);
        this.falha.set(null);
        return;
      }

      this.anuncio.set(null);
      this.carregandoAnuncio.set(true);
      this.falha.set(null);
      void this.lerAnuncio(id, geracao);
    });
  }

  rent(): void {
    const item = this.item();
    if (item) {
      void this.router.navigate(['/pagamento', item.id]);
    }
  }

  setImage(i: number): void {
    this.imageIndex.set(i);
    if (this.fotoComFalha() === i) {
      this.fotoComFalha.set(null);
    }
  }

  imagemAnterior(total: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (total <= 1) {
      return;
    }
    const atual = this.indiceDaFoto(total);
    this.setImage((atual - 1 + total) % total);
  }

  proximaImagem(total: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (total <= 1) {
      return;
    }
    const atual = this.indiceDaFoto(total);
    this.setImage((atual + 1) % total);
  }

  indiceDaFoto(total: number): number {
    if (total <= 0) {
      return 0;
    }
    const indice = this.imageIndex();
    return indice >= 0 && indice < total ? indice : 0;
  }

  fotoAtual(anuncio: Anuncio): string | null {
    const total = anuncio.imagens.length;
    if (total === 0 || this.fotoAtualFalhou(total)) {
      return null;
    }
    return anuncio.imagens[this.indiceDaFoto(total)] || null;
  }

  private fotoAtualFalhou(total: number): boolean {
    return this.fotoComFalha() === this.indiceDaFoto(total);
  }

  registrarFalhaDaFoto(total: number): void {
    this.fotoComFalha.set(this.indiceDaFoto(total));
  }

  toggleFavReal(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const anuncio = this.anuncio();
    if (!anuncio) {
      return;
    }
    this.catalogo.alternarFavorito(anuncio.id);
    this.favTick.update((valor) => valor + 1);
  }

  ehFavReal(): boolean {
    this.favTick();
    const anuncio = this.anuncio();
    return anuncio ? this.catalogo.ehFavorito(anuncio.id) : false;
  }

  private async lerAnuncio(anuncioId: string, geracao: number): Promise<void> {
    try {
      const anuncio = await this.anuncios.obter(anuncioId);
      if (geracao !== this.geracaoReal) {
        return;
      }
      this.anuncio.set(anuncio);
      this.falha.set(anuncio ? null : 'inacessivel');
    } catch (erro) {
      if (geracao !== this.geracaoReal) {
        return;
      }
      console.error('Falha ao abrir anúncio', erro);
      this.anuncio.set(null);
      this.falha.set(codigoDoErro(erro).includes('permission-denied') ? 'inacessivel' : 'erro');
    } finally {
      if (geracao === this.geracaoReal) {
        this.carregandoAnuncio.set(false);
        this.leituraPronta.set(true);
      }
    }
  }

  private buildCalendar(): { day: number | null; selected: boolean }[] {
    const cells: { day: number | null; selected: boolean }[] = [];
    for (let i = 0; i < 3; i++) {
      cells.push({ day: null, selected: false });
    }
    for (let d = 1; d <= 30; d++) {
      cells.push({ day: d, selected: d >= 10 && d <= 16 });
    }
    return cells;
  }
}

function codigoDoErro(erro: unknown): string {
  if (erro && typeof erro === 'object' && 'code' in erro) {
    return String((erro as { code: unknown }).code);
  }
  return '';
}
