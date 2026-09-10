import { Component, computed, inject, input, signal } from '@angular/core';
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
import { arrowBack, heartOutline, shareOutline, star, locationOutline, checkmarkCircle } from 'ionicons/icons';
import { CatalogoService } from '../../core/catalogo.service';

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
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly imageIndex = signal(0);
  readonly item = computed(() => this.catalogo.find(this.id()));
  readonly days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  readonly calendar = this.buildCalendar();

  constructor() {
    addIcons({ arrowBack, heartOutline, shareOutline, star, locationOutline, checkmarkCircle });
  }

  rent(): void {
    const item = this.item();
    if (item) {
      void this.router.navigate(['/pagamento', item.id]);
    }
  }

  setImage(i: number): void {
    this.imageIndex.set(i);
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
