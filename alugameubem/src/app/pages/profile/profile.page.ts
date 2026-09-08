import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { CatalogService } from '../../core/catalog.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, RouterLink],
})
export class ProfilePage {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  readonly profile = this.catalog.profile();

  logout(): void {
    this.catalog.logout();
    void this.router.navigateByUrl('/welcome');
  }
}
