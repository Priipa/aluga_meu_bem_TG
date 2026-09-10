import { Routes } from '@angular/router';
import { guardAutenticado, guardSomenteVisitante } from './core/autenticacao.guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'cadastro',
    canActivate: [guardSomenteVisitante],
    loadComponent: () => import('./pages/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
  {
    path: 'login',
    canActivate: [guardSomenteVisitante],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/explorar/explorar.page').then((m) => m.ExplorarPage),
      },
      {
        path: 'mensagens',
        canActivate: [guardAutenticado],
        loadComponent: () =>
          import('./pages/mensagens/mensagens.page').then((m) => m.MensagensPage),
      },
      {
        path: 'anunciar',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/anunciar/anunciar.page').then((m) => m.AnunciarPage),
      },
      {
        path: 'favoritos',
        canActivate: [guardAutenticado],
        loadComponent: () =>
          import('./pages/favoritos/favoritos.page').then((m) => m.FavoritosPage),
      },
      {
        path: 'perfil',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: 'item/:id',
    loadComponent: () =>
      import('./pages/detalhes-item/detalhes-item.page').then((m) => m.DetalhesItemPage),
  },
  {
    path: 'pagamento/:id',
    canActivate: [guardAutenticado],
    loadComponent: () => import('./pages/pagamento/pagamento.page').then((m) => m.PagamentoPage),
  },
  {
    path: 'chat/:id',
    canActivate: [guardAutenticado],
    loadComponent: () => import('./pages/chat/chat.page').then((m) => m.ChatPage),
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: '**', redirectTo: 'welcome' },
];
