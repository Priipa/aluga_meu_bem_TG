import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, RouterLink, CurrencyPipe],
})
export class FavoritesPage {
  private readonly catalog = inject(CatalogService);
  readonly tick = signal(0);

  items() {
    this.tick();
    return this.catalog.favorites();
  }

  ionViewWillEnter(): void {
    this.tick.update((n) => n + 1);
  }
}
