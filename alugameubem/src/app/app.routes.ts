import { Routes } from '@angular/router';
import { guardAutenticado, guardSomenteVisitante } from './core/autenticacao.guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'register',
    canActivate: [guardSomenteVisitante],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
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
        loadComponent: () => import('./pages/explore/explore.page').then((m) => m.ExplorePage),
      },
      {
        path: 'messages',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/messages/messages.page').then((m) => m.MessagesPage),
      },
      {
        path: 'publish',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/publish/publish.page').then((m) => m.PublishPage),
      },
      {
        path: 'favorites',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      {
        path: 'profile',
        canActivate: [guardAutenticado],
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: 'item/:id',
    loadComponent: () =>
      import('./pages/item-details/item-details.page').then((m) => m.ItemDetailsPage),
  },
  {
    path: 'checkout/:id',
    canActivate: [guardAutenticado],
    loadComponent: () => import('./pages/checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'chat/:id',
    canActivate: [guardAutenticado],
    loadComponent: () => import('./pages/chat/chat.page').then((m) => m.ChatPage),
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: '**', redirectTo: 'welcome' },
];
