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
import { CatalogService } from '../../core/catalog.service';

type FilterKey = 'categoria' | 'local' | 'preco' | 'disponibilidade';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
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
export class ExplorePage {
  private readonly catalog = inject(CatalogService);
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
    let list = this.catalog.search(this.query());
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
    this.catalog.toggleFavorite(id);
    this.favTick.update((n) => n + 1);
  }

  isFav(id: string): boolean {
    this.favTick();
    return this.catalog.isFavorite(id);
  }
}
