import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly mensagemErro = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Preencha e-mail e senha para entrar.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    try {
      const { email, password } = this.form.getRawValue();
      await this.autenticacao.entrar(email, password);
      await this.router.navigateByUrl('/tabs/home');
    } catch (erro) {
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
}
