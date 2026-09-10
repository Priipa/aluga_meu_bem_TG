import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AutenticacaoService } from './autenticacao.service';

function quandoSessaoPronta() {
  const autenticacao = inject(AutenticacaoService);
  return toObservable(autenticacao.carregandoSessao).pipe(
    filter((carregando) => !carregando),
    take(1),
    map(() => autenticacao)
  );
}

export const guardAutenticado: CanActivateFn = () => {
  const router = inject(Router);
  return quandoSessaoPronta().pipe(
    map((autenticacao) =>
      autenticacao.autenticado() ? true : router.createUrlTree(['/login'])
    )
  );
};

export const guardSomenteVisitante: CanActivateFn = () => {
  const router = inject(Router);
  return quandoSessaoPronta().pipe(
    map((autenticacao) =>
      autenticacao.autenticado() ? router.createUrlTree(['/tabs/home']) : true
    )
  );
};
