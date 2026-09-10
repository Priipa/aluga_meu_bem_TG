import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { CatalogoService } from '../../core/catalogo.service';

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, RouterLink, CurrencyPipe],
})
export class FavoritosPage {
  private readonly catalogo = inject(CatalogoService);
  readonly tick = signal(0);

  items() {
    this.tick();
    return this.catalogo.favoritos();
  }

  ionViewWillEnter(): void {
    this.tick.update((n) => n + 1);
  }
}
