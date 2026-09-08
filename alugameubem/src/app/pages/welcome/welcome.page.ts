import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [IonContent, IonButton, RouterLink],
})
export class WelcomePage {
  readonly index = signal(0);
  readonly slides = [
    {
      title: 'Não compre, pegue emprestado.',
      text: 'Alugue itens de pessoas na sua comunidade. Economize dinheiro e reduza o desperdício.',
    },
    {
      title: 'Sua vizinhança tem o que você precisa.',
      text: 'Ferramentas, câmeras, bikes e muito mais. Use quando quiser e devolva no dia combinado.',
    },
    {
      title: 'Aluguel simples e com confiança.',
      text: 'Converse com o locador, veja avaliações e pague só pelos dias que realmente usar.',
    },
  ];

  goTo(i: number): void {
    this.index.set(i);
  }

  next(): void {
    this.index.update((i) => (i + 1) % this.slides.length);
  }
}
