import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

@Component({
  selector: 'app-publish',
  templateUrl: './publish.page.html',
  styleUrls: ['./publish.page.scss'],
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    ReactiveFormsModule,
  ],
})
export class PublishPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly published = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['Casa', Validators.required],
    price: [30, [Validators.required, Validators.min(1)]],
    neighborhood: ['', Validators.required],
    description: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.published.set(true);
    setTimeout(() => void this.router.navigateByUrl('/tabs/home'), 900);
  }
}
