import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, qrCodeOutline } from 'ionicons/icons';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonIcon,
    CurrencyPipe,
  ],
})
export class CheckoutPage {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  readonly item = computed(() => this.catalog.find(this.id()));
  readonly method = signal<'pix' | 'card'>('pix');
  readonly days = 7;
  paid = signal(false);

  constructor() {
    addIcons({ qrCodeOutline, cardOutline });
  }

  total(): number {
    return (this.item()?.pricePerDay ?? 0) * this.days;
  }

  confirm(): void {
    this.paid.set(true);
  }

  goHome(): void {
    void this.router.navigateByUrl('/tabs/home');
  }
}
