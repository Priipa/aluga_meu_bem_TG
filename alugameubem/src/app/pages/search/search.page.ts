import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonSearchbar, IonTitle, IonToolbar } from '@ionic/angular';
import { CatalogService } from '../../core/catalog.service';
import { Item } from '../../core/models';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, FormsModule, RouterLink, CurrencyPipe],
})
export class SearchPage {
  private readonly catalog = inject(CatalogService);
  readonly query = signal('');
  readonly results = signal<Item[]>(this.catalog.list());

  onSearch(value: string | null | undefined): void {
    const term = value ?? '';
    this.query.set(term);
    this.results.set(this.catalog.search(term));
  }
}
