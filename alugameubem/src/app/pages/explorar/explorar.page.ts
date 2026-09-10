import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronDown, heart, heartOutline, mapOutline } from 'ionicons/icons';
import { CatalogoService } from '../../core/catalogo.service';

type FilterKey = 'categoria' | 'local' | 'preco' | 'disponibilidade';

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.page.html',
  styleUrls: ['./explorar.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonSearchbar,
    RouterLink,
    CurrencyPipe,
  ],
})
export class ExplorarPage {
  private readonly catalogo = inject(CatalogoService);
  readonly query = signal('');
  readonly activeFilter = signal<FilterKey>('categoria');
  readonly category = signal<string | null>(null);
  readonly favTick = signal(0);
  readonly showMap = signal(false);

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'categoria', label: 'Categoria' },
    { key: 'local', label: 'Local' },
    { key: 'preco', label: 'Preço' },
    { key: 'disponibilidade', label: 'Disponibilidade' },
  ];

  readonly items = computed(() => {
    this.favTick();
    let list = this.catalogo.search(this.query());
    const category = this.category();
    if (category) {
      list = list.filter((item) => item.categories.includes(category));
    }
    return list;
  });

  constructor() {
    addIcons({ mapOutline, chevronDown, heartOutline, heart });
  }

  setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    if (key === 'categoria') {
      const options = ['Ferramentas', 'Eletrônicos', 'Esporte', 'Música'];
      const current = this.category();
      const next = options[(options.indexOf(current ?? '') + 1) % options.length];
      this.category.set(next);
    }
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
}
