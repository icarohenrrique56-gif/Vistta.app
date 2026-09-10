import * as Sentry from '@sentry/react';
import { getAnalytics, isSupported, logEvent, type Analytics, type AnalyticsCallOptions, type EventParams } from 'firebase/analytics';

const blockedKeys = new Set([
  'password', 'senha', 'token', 'accesstoken', 'refreshtoken', 'apikey', 'secret',
  'authorization', 'cookie', 'cardnumber', 'cvv'
]);
const maxDepth = 4;
const maxKeys = 40;
const maxStringLength = 500;

export interface TelemetryContext {
  module?: string;
  action?: string;
  operation?: string;
  route?: string;
  [key: string]: unknown;
}

export interface GlitchTipTestHooks {
  throwJavaScript: () => void;
  rejectPromise: () => void;
  throwReact: () => void;
  firebaseRead: () => Promise<void>;
}

declare global {
  interface Window {
    __VISTTA_GLITCHTIP_TEST__?: GlitchTipTestHooks;
  }
}

function currentRoute() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.slice(0, maxStringLength);
  if (depth >= maxDepth) return '[truncated]';
  if (value instanceof Error) {
    return { name: value.name, message: value.message.slice(0, maxStringLength), code: (value as Error & { code?: string }).code, stack: value.stack?.slice(0, maxStringLength) };
  }
  if (Array.isArray(value)) return value.slice(0, maxKeys).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value !== 'object') return String(value).slice(0, maxStringLength);

  const result: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).slice(0, maxKeys).forEach(([key, item]) => {
    if (blockedKeys.has(key.toLowerCase())) return;
    result[key] = sanitizeValue(item, depth + 1);
  });
  return result;
}

export function sanitizeContext(value: unknown) {
  return sanitizeValue(value) as Record<string, unknown>;
}

function applyScopeContext(scope: Sentry.Scope, context: TelemetryContext = {}) {
  const safeContext = sanitizeContext({ ...context, route: context.route || currentRoute(), release: import.meta.env.VITE_APP_RELEASE });
  scope.setTag('route', String(safeContext.route));
  if (safeContext.module) scope.setTag('module', String(safeContext.module));
  if (safeContext.action) scope.setTag('action', String(safeContext.action));
  if (safeContext.operation) scope.setTag('operation', String(safeContext.operation));
  scope.setContext('vistta', safeContext);
}

export function sanitizeSentryEvent(event: any) {
  const sanitized = { ...event };
  if (sanitized.user) sanitized.user = sanitized.user.id ? { id: sanitized.user.id } : undefined;
  if (sanitized.extra) sanitized.extra = sanitizeContext(sanitized.extra);
  if (sanitized.contexts) sanitized.contexts = sanitizeContext(sanitized.contexts);
  if (sanitized.tags) sanitized.tags = sanitizeContext(sanitized.tags);
  if (sanitized.breadcrumbs) {
    sanitized.breadcrumbs = sanitized.breadcrumbs.map((breadcrumb: any) => ({
      ...breadcrumb,
      data: breadcrumb.data ? sanitizeContext(breadcrumb.data) : undefined,
      message: typeof breadcrumb.message === 'string' ? breadcrumb.message.slice(0, maxStringLength) : breadcrumb.message
    }));
  }
  if (sanitized.request) {
    sanitized.request = { method: sanitized.request.method, url: sanitized.request.url ? new URL(sanitized.request.url, window.location.origin).pathname : undefined };
  }
  return sanitized;
}

export function captureException(error: unknown, context: TelemetryContext = {}) {
  Sentry.withScope((scope) => {
    applyScopeContext(scope, context);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, context: TelemetryContext = {}) {
  Sentry.withScope((scope) => {
    applyScopeContext(scope, context);
    Sentry.captureMessage(message);
  });
}

export function captureFirebaseError(error: unknown, context: TelemetryContext = {}) {
  captureException(error, { ...context, operation: context.operation || 'firebase' });
}

export function setUserContext(user: { id: string } | null) {
  Sentry.setUser(user ? { id: user.id } : null);
}

export function setModuleContext(module: string, action?: string) {
  Sentry.setTag('module', module);
  if (action) Sentry.setTag('action', action);
  Sentry.setTag('route', currentRoute());
}

export function addBreadcrumb(message: string, data: TelemetryContext = {}) {
  Sentry.addBreadcrumb({ category: 'vistta', message, level: 'info', data: sanitizeContext(data) });
}

export function registerGlitchTipTestHooks() {
  if (typeof window === 'undefined' || import.meta.env.VITE_APP_ENVIRONMENT === 'production') return;
  window.__VISTTA_GLITCHTIP_TEST__ = {
    throwJavaScript: () => window.setTimeout(() => { throw new Error('VISTTA TESTE - GlitchTip'); }, 0),
    rejectPromise: () => { void Promise.reject(new Error('VISTTA TESTE - Unhandled Rejection')); },
    throwReact: () => window.dispatchEvent(new Event('vistta-glitchtip-test-react')),
    firebaseRead: async () => {
      const [{ get, ref }, { db }] = await Promise.all([import('firebase/database'), import('../config/firebase')]);
      try {
        await get(ref(db, '__vistta_glitchtip_test__/read'));
      } catch (error) {
        captureFirebaseError(error, { module: 'autenticacao', action: 'teste_firebase', operation: 'database_read' });
        throw error;
      }
      captureMessage('VISTTA TESTE - Firebase sem erro de permissão', { module: 'autenticacao', action: 'teste_firebase', operation: 'database_read' });
    }
  };
}

let analyticsPromise: Promise<Analytics | null> | null = null;

async function getOptionalAnalytics() {
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;
  if (!analyticsPromise) {
    analyticsPromise = Promise.all([isSupported(), import('../config/firebase')])
      .then(([supported, { app }]) => supported ? getAnalytics(app) : null)
      .catch(() => null);
  }
  return analyticsPromise;
}

export async function trackEvent(name: string, params?: EventParams, options?: AnalyticsCallOptions) {
  const analytics = await getOptionalAnalytics();
  if (!analytics) return;
  logEvent(analytics, name, params, options);
}
