import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart } from 'ionicons/icons';
import { AnuncioService } from '../../core/anuncio.service';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { CatalogoService } from '../../core/catalogo.service';
import { Anuncio } from '../../core/models';

type EstadoFavoritos =
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
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, RouterLink, CurrencyPipe],
})
export class FavoritosPage {
  private readonly anunciosServico = inject(AnuncioService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly catalogo = inject(CatalogoService);
  private geracaoLista = 0;

  private readonly anuncios = signal<Anuncio[]>([]);
  private readonly carregandoAnuncios = signal(false);
  private readonly leituraPronta = signal(false);
  private readonly erroLeitura = signal(false);
  private readonly capasComFalha = signal<ReadonlySet<string>>(new Set());

  readonly itens = computed(() => {
    const ids = this.catalogo.idsFavoritos();
    return this.anuncios().filter((anuncio) => ids.has(anuncio.id));
  });

  readonly estado = computed((): EstadoFavoritos => {
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
    addIcons({ heart });
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

  desfavoritar(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.catalogo.ehFavorito(id)) {
      this.catalogo.alternarFavorito(id);
    }
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
