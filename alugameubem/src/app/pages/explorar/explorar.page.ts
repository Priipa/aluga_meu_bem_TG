import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronDown, heart, heartOutline, notificationsOutline } from 'ionicons/icons';
import { AnuncioService } from '../../core/anuncio.service';
import { filtrarAnunciosDaHome } from '../../core/anuncio-lista';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { CATEGORIAS } from '../../core/categorias';
import { CatalogoService } from '../../core/catalogo.service';
import { Anuncio } from '../../core/models';

type FilterKey = 'categoria' | 'local' | 'preco' | 'disponibilidade';

type EstadoHome =
  | 'sessao'
  | 'visitante'
  | 'ausente'
  | 'inconsistente'
  | 'erro-vinculo'
  | 'carregando'
  | 'erro-leitura'
  | 'vazio'
  | 'lista';

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.page.html',
  styleUrls: ['./explorar.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonContent,
    IonIcon,
    IonSearchbar,
    RouterLink,
    CurrencyPipe,
  ],
})
export class ExplorarPage {
  private readonly anunciosServico = inject(AnuncioService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly catalogo = inject(CatalogoService);
  private geracaoLista = 0;

  readonly query = signal('');
  readonly activeFilter = signal<FilterKey>('categoria');
  readonly category = signal<string | null>(null);
  readonly favTick = signal(0);
  private readonly anuncios = signal<Anuncio[]>([]);
  private readonly carregandoAnuncios = signal(false);
  private readonly leituraPronta = signal(false);
  private readonly erroLeitura = signal(false);
  private readonly capasComFalha = signal<ReadonlySet<string>>(new Set());

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'categoria', label: 'Categoria' },
    { key: 'local', label: 'Local' },
    { key: 'preco', label: 'Preço' },
    { key: 'disponibilidade', label: 'Disponibilidade' },
  ];

  readonly itens = computed(() =>
    filtrarAnunciosDaHome(this.anuncios(), this.query(), this.category()),
  );

  readonly estado = computed((): EstadoHome => {
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
    if (this.erroLeitura()) {
      return 'erro-leitura';
    }
    if (this.carregandoAnuncios() || !this.leituraPronta()) {
      return 'carregando';
    }
    if (this.itens().length === 0) {
      return 'vazio';
    }
    return 'lista';
  });

  constructor() {
    addIcons({ notificationsOutline, chevronDown, heartOutline, heart });
    effect(() => {
      const carregandoSessao = this.autenticacao.carregandoSessao();
      const autenticado = this.autenticacao.autenticado();
      const situacao = this.autenticacao.situacaoVinculo();
      const condominioId = this.autenticacao.condominioId();
      const geracao = ++this.geracaoLista;

      if (carregandoSessao || !autenticado || situacao !== 'unico' || !condominioId) {
        this.anuncios.set([]);
        this.carregandoAnuncios.set(false);
        this.leituraPronta.set(false);
        this.erroLeitura.set(false);
        return;
      }

      this.carregandoAnuncios.set(true);
      this.erroLeitura.set(false);
      void this.lerCondominio(condominioId, geracao);
    });
  }

  rotuloFiltro(filtro: { key: FilterKey; label: string }): string {
    if (filtro.key === 'categoria' && this.category()) {
      return this.category() ?? filtro.label;
    }
    return filtro.label;
  }

  setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    if (key !== 'categoria') {
      return;
    }
    const atual = this.category();
    const indice = CATEGORIAS.findIndex((categoria) => categoria === atual);
    this.category.set(CATEGORIAS[(indice + 1) % CATEGORIAS.length]);
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

  toggleFav(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.catalogo.alternarFavorito(id);
    this.favTick.update((n) => n + 1);
  }

  isFav(id: string): boolean {
    this.favTick();
    return this.catalogo.ehFavorito(id);
  }

  private async lerCondominio(condominioId: string, geracao: number): Promise<void> {
    try {
      const lista = await this.anunciosServico.listarDoCondominio(condominioId);
      if (geracao !== this.geracaoLista) {
        return;
      }
      this.anuncios.set(lista);
      this.erroLeitura.set(false);
    } catch (erro) {
      if (geracao !== this.geracaoLista) {
        return;
      }
      console.error('Falha ao ler anúncios do condomínio', erro);
      this.anuncios.set([]);
      this.erroLeitura.set(true);
    } finally {
      if (geracao === this.geracaoLista) {
        this.carregandoAnuncios.set(false);
        this.leituraPronta.set(true);
      }
    }
  }
}
