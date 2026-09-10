import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, RouterLink],
})
export class ProfilePage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  readonly perfil = this.autenticacao.perfil;
  readonly erroSessao = this.autenticacao.erroSessao;

  async logout(): Promise<void> {
    await this.autenticacao.sair();
    await this.router.navigateByUrl('/welcome');
  }
}
