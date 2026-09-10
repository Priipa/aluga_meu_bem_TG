import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class CadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  readonly showPassword = signal(false);
  readonly carregando = signal(false);
  readonly mensagemErro = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    cpf: ['', [Validators.required, Validators.minLength(14)]],
    phone: ['', [Validators.required, Validators.minLength(14)]],
  });

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, shieldCheckmarkOutline });
  }

  maskCpf(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    let value = p1;
    if (p2) value = `${p1}.${p2}`;
    if (p3) value = `${p1}.${p2}.${p3}`;
    if (p4) value = `${p1}.${p2}.${p3}-${p4}`;
    this.form.controls.cpf.setValue(value);
  }

  maskPhone(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const ddd = digits.slice(0, 2);
    const mid = digits.slice(2, 7);
    const end = digits.slice(7, 11);
    let value = digits;
    if (digits.length > 2) value = `(${ddd}) ${mid}`;
    if (digits.length > 7) value = `(${ddd}) ${mid}-${end}`;
    this.form.controls.phone.setValue(value);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Preencha todos os campos para criar sua conta.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    try {
      const { name, email, password, cpf, phone } = this.form.getRawValue();
      await this.autenticacao.criarConta({
        nome: name,
        email,
        senha: password,
        cpf,
        telefone: phone,
      });
      await this.router.navigateByUrl('/tabs/home');
    } catch (erro) {
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
}
