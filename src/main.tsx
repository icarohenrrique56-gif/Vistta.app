import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlitchTipTestHarness } from './components/GlitchTipTestHarness'
import { registerGlitchTipTestHooks, sanitizeSentryEvent } from './services/telemetry'

Sentry.init({
  dsn: 'https://0ff0dfb7a2da424682bd3420028b6433@app.glitchtip.com/27643',
  release: import.meta.env.VITE_APP_RELEASE,
  environment: import.meta.env.VITE_APP_ENVIRONMENT,
  beforeSend: sanitizeSentryEvent,
  tracesSampleRate: 0.01,
});
registerGlitchTipTestHooks();

const requiredFirebaseVariables = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

const missingFirebaseVariables = requiredFirebaseVariables.filter((name) => !import.meta.env[name]?.trim());
const App = missingFirebaseVariables.length === 0 ? React.lazy(() => import('./App')) : null;

function MissingFirebaseConfig() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f6f4] p-6 text-[#30204d]">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#6d4aff]">VISTTA ERP</p>
        <h1 className="mb-3 text-2xl font-bold">Configuração do Firebase pendente</h1>
        <p className="mb-6 text-sm leading-6 text-slate-600">
          O deploy foi carregado, mas as variáveis do Firebase ainda não foram cadastradas no ambiente de build do Firebase Hosting.
        </p>
        <div className="rounded-2xl bg-slate-50 p-4 text-left">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Variáveis ausentes</p>
          <ul className="space-y-1 font-mono text-xs text-rose-700">
            {missingFirebaseVariables.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">
          Preencha as variáveis VITE_FIREBASE_* no ambiente local antes do build e publique novamente no Firebase Hosting.
        </p>
      </section>
    </main>
  );
}

function AppLoading() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f6f4] text-sm font-semibold text-[#30204d]">Carregando VISTTA...</div>;
}

const savedTheme = localStorage.getItem('otica_theme')
document.documentElement.classList.toggle('dark', savedTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Sentry.ErrorBoundary fallback={<p>Não foi possível carregar esta tela. Recarregue a aplicação e tente novamente.</p>}>
        {App ? <Suspense fallback={<AppLoading />}><App /></Suspense> : <MissingFirebaseConfig />}
        {import.meta.env.VITE_APP_ENVIRONMENT !== 'production' && <GlitchTipTestHarness />}
      </Sentry.ErrorBoundary>
    </ErrorBoundary>
  </React.StrictMode>,
)
