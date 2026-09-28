import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/angular';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonModal, RouterLink],
})
export class PerfilPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  readonly perfil = this.autenticacao.perfil;
  readonly ehLocador = this.autenticacao.ehLocador;
  readonly erroSessao = this.autenticacao.erroSessao;
  readonly erroAtivacao = signal('');
  readonly ativando = signal(false);
  readonly modalLocador = signal(false);
  readonly aceiteLocador = signal(false);

  abrirAtivacao(): void {
    if (this.ativando() || this.ehLocador() || this.modalLocador()) {
      return;
    }

    this.erroAtivacao.set('');
    this.aceiteLocador.set(false);
    this.modalLocador.set(true);
  }

  definirAceite(evento: Event): void {
    const entrada = evento.target;
    this.aceiteLocador.set(entrada instanceof HTMLInputElement && entrada.checked);
  }

  impedirEnterSemAceite(evento: Event): void {
    if (!this.aceiteLocador()) {
      evento.preventDefault();
    }
  }

  descartarAceiteLocador(): void {
    this.modalLocador.set(false);
    this.aceiteLocador.set(false);
  }

  async concluirAtivacao(): Promise<void> {
    if (!this.aceiteLocador() || this.ativando()) {
      return;
    }

    this.modalLocador.set(false);
    this.ativando.set(true);
    this.erroAtivacao.set('');
    try {
      await this.autenticacao.ativarLocador();
    } catch (erro) {
      this.erroAtivacao.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.ativando.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.autenticacao.sair();
    await this.router.navigateByUrl('/welcome');
  }
}
