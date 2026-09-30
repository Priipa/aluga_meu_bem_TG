import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, personOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { nomeExibicao } from '../../core/nome-exibicao';
import { PARAGRAFOS_TERMOS_LOCADOR, VERSAO_TERMOS_LOCADOR } from '../../core/termos';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonModal, RouterLink],
})
export class PerfilPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  readonly perfil = this.autenticacao.perfil;
  readonly nomeCurto = computed(() => nomeExibicao(this.perfil()?.name ?? '') || 'Visitante');
  readonly ehLocador = this.autenticacao.ehLocador;
  readonly erroSessao = this.autenticacao.erroSessao;
  readonly erroAtivacao = signal('');
  readonly ativando = signal(false);
  readonly modalLocador = signal(false);
  readonly consultaLocador = signal(false);
  readonly aceiteLocador = signal(false);
  readonly paragrafosTermosLocador = PARAGRAFOS_TERMOS_LOCADOR;
  readonly versaoTermosLocador = VERSAO_TERMOS_LOCADOR;

  constructor() {
    addIcons({ personOutline, chevronForwardOutline });
  }

  abrirAtivacao(): void {
    if (this.ativando() || this.ehLocador() || this.modalLocador() || this.consultaLocador()) {
      return;
    }

    this.erroAtivacao.set('');
    this.aceiteLocador.set(false);
    this.modalLocador.set(true);
  }

  abrirConsultaLocador(): void {
    if (!this.ehLocador() || this.modalLocador() || this.consultaLocador()) {
      return;
    }

    this.consultaLocador.set(true);
  }

  fecharConsultaLocador(): void {
    this.consultaLocador.set(false);
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
