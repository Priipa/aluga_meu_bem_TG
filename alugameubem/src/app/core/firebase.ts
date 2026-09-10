import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

export const appFirebase =
  getApps()[0] ?? initializeApp(environment.configuracaoFirebase);

export const autenticacaoFirebase = getAuth(appFirebase);
export const bancoFirestore = getFirestore(appFirebase);

export async function iniciarAnalytics(): Promise<void> {
  if (await isSupported()) {
    getAnalytics(appFirebase);
  }
}
