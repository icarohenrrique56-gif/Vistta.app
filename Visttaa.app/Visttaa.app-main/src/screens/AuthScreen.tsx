import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db } from '../config/firebase';
import { captureFirebaseError, trackEvent } from '../services/telemetry';
import { Mail, Lock, EyeOff, Eye, Store, Package, BarChart3, ShieldCheck, Instagram, Linkedin, ArrowUpRight, CheckCircle2, Moon, Sun } from 'lucide-react';
import { CreatorLogo, FeedbackAlert, LogoVistta, ModalBase } from '../components/SharedUI';
import { isValidEmail, sanitizeEmailInput } from '../utils/documentMask';

export function AuthScreen() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover' | 'reset'>('login');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | null>(null);
  const [resetFeedback, setResetFeedback] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const code = params.get('oobCode');
    if (mode !== 'resetPassword' || !code) return;
    setAuthMode('reset');
    setResetCode(code);
    verifyPasswordResetCode(auth, code).then(email => {
      setAuthEmail(email);
    }).catch(() => {
      captureFirebaseError(new Error('Link de recuperação inválido ou expirado.'), { module: 'autenticacao', action: 'validar_recuperacao', operation: 'auth_password_reset' });
      setAuthError('Este link de recuperação expirou ou é inválido. Solicite um novo link.');
      setResetCode('');
    });
  }, []);

  useEffect(() => {
    void getRedirectResult(auth).catch(error => {
      captureFirebaseError(error, { module: 'autenticacao', action: 'login_google_redirect', operation: 'auth_sign_in' });
      setAuthError(getGoogleErrorMessage(error));
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = sanitizeEmailInput(authEmail);
    setAuthError('');
    setResetFeedback('');
    setAccountExists(false);

    if (!isValidEmail(normalizedEmail)) {
      setAuthError('Informe um e-mail válido com letras, números e os caracteres permitidos.');
      return;
    }

    setIsLoggingIn(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, normalizedEmail, authPassword);
        void trackEvent('login', { method: 'password' });
      } else if (authMode === 'register') {
        if (authPassword.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        if (authPassword !== authConfirmPassword) throw new Error('As senhas não coincidem.');
        if (!acceptedTerms) throw new Error('Aceite os Termos de Uso e a Política de Privacidade para continuar.');

        const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, authPassword);
        try {
          await update(ref(db, `users/${userCred.user.uid}`), {
            role: 'admin',
            status: 'active',
            email: normalizedEmail,
            nome: ''
          });
        } catch (dbErr: any) {
          await userCred.user.delete();
          if (dbErr?.code === 'PERMISSION_DENIED' || dbErr?.code === 'database/permission-denied') {
            throw new Error('O Firebase recusou o perfil inicial. Verifique se as regras do Realtime Database estão publicadas no projeto correto.');
          }
          throw new Error(dbErr?.message || 'Não foi possível concluir o cadastro. Tente novamente.');
        }
      }
    } catch (error: any) {
      captureFirebaseError(error, { module: 'autenticacao', action: authMode === 'login' ? 'login' : 'criar_conta', operation: 'auth_sign_in' });
      if (error?.code === 'auth/email-already-in-use') {
        setAccountExists(true);
        setAuthError('Este e-mail já possui uma conta. Entre com sua conta existente ou recupere sua senha.');
      } else if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        setAuthError('Não foi possível entrar. Verifique suas credenciais e tente novamente.');
      } else if (error?.code === 'auth/invalid-email') {
        setAuthError('Informe um e-mail válido.');
      } else if (error?.code === 'auth/network-request-failed') {
        setAuthError('Não foi possível concluir a operação. Verifique sua conexão e tente novamente.');
      } else {
        setAuthError(error?.message || (authMode === 'login' ? 'Não foi possível entrar. Tente novamente.' : 'Não foi possível criar sua conta. Tente novamente.'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      void trackEvent('login_google');
      console.info('[AUTH] login com Google concluído', { uid: result.user.uid, provider: result.providerId });
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return;
      }
      captureFirebaseError(error, { module: 'autenticacao', action: 'login_google', operation: 'auth_sign_in' });
      setAuthError(getGoogleErrorMessage(error));
      setIsLoggingIn(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = sanitizeEmailInput(authEmail);
    if (!isValidEmail(email)) {
      setAuthError('Informe um e-mail válido para receber o link de recuperação.');
      return;
    }

    setAuthError('');
    setResetFeedback('');
    setIsLoggingIn(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetFeedback('Se houver uma conta associada a este e-mail, enviaremos as instruções para recuperação. Verifique também a pasta de spam.');
    } catch (error: any) {
      captureFirebaseError(error, { module: 'autenticacao', action: 'recuperar_senha', operation: 'auth_password_reset' });
      setResetFeedback(error?.code === 'auth/network-request-failed'
        ? 'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.'
        : 'Se houver uma conta associada a este e-mail, enviaremos as instruções para recuperação. Verifique também a pasta de spam.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetCode) {
      setAuthError('Este link de recuperação expirou ou é inválido. Solicite um novo link.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    setAuthError('');
    setIsLoggingIn(true);
    try {
      await confirmPasswordReset(auth, resetCode, authPassword);
      window.history.replaceState({}, document.title, window.location.pathname);
      setResetCode('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthMode('login');
      setResetFeedback('Senha redefinida com sucesso. Entre com sua nova senha.');
    } catch (error: any) {
      captureFirebaseError(error, { module: 'autenticacao', action: 'redefinir_senha', operation: 'auth_password_reset' });
      setAuthError(error?.code === 'auth/expired-action-code' || error?.code === 'auth/invalid-action-code'
        ? 'Este link de recuperação expirou ou já foi utilizado. Solicite um novo link.'
        : 'Não foi possível redefinir a senha. Tente solicitar um novo link.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const openMode = (mode: 'login' | 'register' | 'recover' | 'reset') => {
    setAuthMode(mode);
    setAuthError('');
    setResetFeedback('');
    setAccountExists(false);
    setAuthPassword('');
    setAuthConfirmPassword('');
  };

  function getGoogleErrorMessage(error: any) {
    const errorMessage = String(error?.message || '').toLowerCase();
    if (error?.code === 'auth/unauthorized-domain') {
      return `Domínio não autorizado: ${window.location.hostname}. No Firebase Console, abra Authentication > Settings > Authorized domains e adicione este domínio.`;
    }
    if (error?.code === 'auth/invalid-api-key' || errorMessage.includes('api_key_http_referrer_blocked') || errorMessage.includes('requests from referer')) {
      return 'A API key do Firebase bloqueou este domínio. No Google Cloud Console, abra APIs e serviços > Credenciais, edite a chave do projeto vistta-2e1df e autorize o domínio atual. Depois, publique o build novamente.';
    }
    if (error?.code === 'auth/popup-blocked') return 'O pop-up foi bloqueado. Tente novamente para continuar pelo redirecionamento.';
    if (error?.code === 'auth/popup-closed-by-user') return 'O login do Google foi cancelado.';
    if (error?.code === 'auth/operation-not-allowed') return 'O provedor Google não está ativado no Firebase Authentication.';
    if (error?.code === 'auth/account-exists-with-different-credential') return 'Este e-mail já está vinculado a outro método de acesso. Entre usando o método original ou recupere sua senha.';
    if (error?.code === 'auth/network-request-failed') return 'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.';
    return 'Não foi possível entrar com Google. Tente novamente.';
  }

  const inputClass = isDark
    ? 'w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#9c4cff]'
    : 'w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#9c4cff]';
  const mutedTextClass = isDark ? 'text-white/60' : 'text-slate-600';
  const labelClass = isDark ? 'text-white/55' : 'text-slate-600';

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('otica_theme', next ? 'dark' : 'light');
  };

  return (
    <div className={`relative flex min-h-[100dvh] w-full overflow-hidden ${isDark ? 'bg-[#0b0818] text-white' : 'bg-[#f5f2fb] text-[#201735]'} font-sans`}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="absolute right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e1ec] bg-white/80 text-[#201735] shadow-lg backdrop-blur-sm transition hover:text-[#6d4aff] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className={`relative hidden w-[53%] min-w-0 flex-col justify-center p-8 lg:flex xl:p-12 ${isDark ? 'bg-[#120d28]' : 'bg-[#f2effa]'}`}>
        <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_18%_15%,_rgba(121,96,255,0.35),_transparent_24%),radial-gradient(circle_at_78%_100%,_rgba(100,77,255,0.18),_transparent_28%)]' : 'bg-[radial-gradient(circle_at_18%_15%,_rgba(146,125,255,0.16),_transparent_22%),radial-gradient(circle_at_78%_100%,_rgba(109,74,255,0.12),_transparent_25%)]'}`} />
        <div className="relative z-10 w-full max-w-[700px]">
          <div className="mb-8 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#080a12] p-1.5 shadow-[0_12px_28px_rgba(18,12,36,.18)]">
              <LogoVistta className="h-full w-full" solidWhite={false} />
            </span>
            <div>
              <div className={`font-display text-[42px] font-black tracking-[.12em] ${isDark ? 'text-white' : 'text-[#201735]'}`}>VISTTA</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[.26em] text-[#6d4aff]">Gestão inteligente para óticas</div>
            </div>
          </div>

          <div className="mb-10 max-w-[560px]">
            <h2 className={`font-display text-[58px] font-black leading-[0.95] tracking-[-0.06em] ${isDark ? 'text-white' : 'text-[#201735]'}`}>
              Mais controle.<br />
              <span className="bg-gradient-to-r from-[#6d4aff] to-[#b07eff] bg-clip-text text-transparent">Melhores resultados.</span>
            </h2>
            <div className={`mt-5 h-[2px] w-20 ${isDark ? 'bg-white/30' : 'bg-[#6d4aff]/80'}`} />
            <p className={`mt-6 max-w-[440px] text-[15px] leading-relaxed ${isDark ? 'text-white/70' : 'text-[#504d5f]'}`}>
              A plataforma completa para otimizar a gestão da sua ótica e crescer com eficiência.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 xl:gap-6">
            {[
              [Store, 'Gestão multi-loja', 'Centralize e gerencie todas as suas lojas.'],
              [Package, 'Estoque em tempo real', 'Acompanhe cada produto com precisão instantânea.'],
              [BarChart3, 'Relatórios inteligentes', 'Insights claros para decisões mais estratégicas.']
            ].map(([Icon, title, description]) => (
              <div key={title as string} className="max-w-[178px]">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[16px] border ${isDark ? 'border-[#8d63ff]/25 bg-[#1f1735] text-[#d9d1ff]' : 'border-[#d9cffd] bg-[#f6f0ff] text-[#6d4aff]'} shadow-sm`}>
                  {(Icon as any).size ? <Icon size={24} /> : null}
                </div>
                <h3 className={`mb-2 text-[13px] font-bold ${isDark ? 'text-white' : 'text-[#201735]'}`}>{title as string}</h3>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/65' : 'text-[#534d63]'}`}>{description as string}</p>
              </div>
            ))}
          </div>

          <div className={`mt-9 inline-flex w-fit items-center gap-3 rounded-full border px-4 py-3 text-[12px] font-semibold ${isDark ? 'border-[#8d63ff]/30 bg-[#251d45] text-[#e2d9ff]' : 'border-[#8f7adf] bg-[#f1ebff] text-[#4f3f7e]'}`}>
            <ShieldCheck size={18} className="text-[#6d4aff]" />
            Seguro, rápido e feito para óticas.
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {['Vendas e PDV', 'Estoque, clientes e ordens de serviço'].map((item) => (
              <div key={item} className={`flex items-center justify-between rounded-full border px-4 py-3 text-[12px] font-medium ${isDark ? 'border-[#8d63ff]/25 bg-[#1a132d] text-white/80' : 'border-[#d9d1f0] bg-[#f5f1ff] text-[#2d2244]'}`}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-[#6d4aff]" />
                  {item}
                </div>
                <ArrowUpRight size={14} className="text-[#6d4aff]" />
              </div>
            ))}
          </div>

          <div className={`mt-8 inline-flex w-fit items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-[0_12px_24px_rgba(40,27,63,.16)] backdrop-blur-sm ${isDark ? 'border-[#8d63ff]/25 bg-[#2a1e4d]/80' : 'border-[#e7dff8] bg-[#ffffff]/80'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#080a12] p-1">
              <CreatorLogo className="h-full w-full" solidWhite={false} />
            </span>
            <span className="min-w-0">
              <strong className={`block text-xs tracking-[.14em] ${isDark ? 'text-white' : 'text-[#201735]'}`}>AXXIS7</strong>
              <small className={`block truncate text-[10px] ${isDark ? 'text-white/60' : 'text-[#635b76]'}`}>Desenvolvedora da VISTTA</small>
            </span>
            <ArrowUpRight size={14} className="ml-1 text-[#6d4aff]" />
          </div>
        </div>
      </div>

      <div className={`flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-[#0b0818]' : 'bg-[#f4f2f8]'}`}>
        <div className="w-full max-w-[470px]">
          <div className={`${isDark ? 'bg-white/[0.055] border-[#8d63ff]/30 shadow-[0_24px_70px_rgba(0,0,0,.32)]' : 'bg-white shadow-[0_18px_40px_rgba(31,25,54,.08)] border border-[#ebe6f6]'} rounded-[28px] p-6 sm:p-7`}>
            <div className="mb-7 text-center">
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] ${isDark ? 'border-[#7c5dff]/30 bg-[#20163d] text-[#d8c8ff]' : 'border-[#e4dcfd] bg-[#f7f3ff] text-[#6d4aff]'}`}>
                <ShieldCheck size={12} /> Acesso seguro
              </div>
              <h2 className={`font-display text-[30px] font-black tracking-[-0.04em] ${isDark ? 'text-white' : 'text-[#201735]'}`}>
                {authMode === 'login' ? 'Bem-vindo de volta!' : authMode === 'register' ? 'Crie sua conta' : authMode === 'recover' ? 'Recuperar senha' : 'Definir nova senha'}
              </h2>
              {authMode === 'login' && <p className={`mt-2 text-[14px] ${mutedTextClass}`}>Acesse sua conta para continuar.</p>}
              {authMode === 'register' && <p className={`mt-2 text-[14px] ${mutedTextClass}`}>Comece a gerenciar sua ótica de forma inteligente.</p>}
              {authMode === 'recover' && <p className={`mt-2 text-[14px] ${mutedTextClass}`}>Digite seu e-mail para receber o link de recuperação.</p>}
              {authMode === 'reset' && <p className={`mt-2 text-[14px] ${mutedTextClass}`}>Escolha uma nova senha para voltar a acessar sua conta.</p>}
            </div>

            <form onSubmit={authMode === 'recover' ? (event) => { event.preventDefault(); void handlePasswordReset(); } : authMode === 'reset' ? handlePasswordChange : handleAuth} className="space-y-4">
              {authError && <FeedbackAlert>{authError}</FeedbackAlert>}
              {resetFeedback && <FeedbackAlert type="success">{resetFeedback}</FeedbackAlert>}
              {accountExists && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[#6d4aff]">
                  <button type="button" onClick={() => openMode('login')} className="hover:underline">Entrar</button>
                  <button type="button" onClick={() => openMode('recover')} className="hover:underline">Esqueci minha senha</button>
                </div>
              )}

              <div>
                <label className={`mb-2 block text-[11px] font-bold uppercase tracking-[.15em] ${labelClass}`}>E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required readOnly={authMode === 'reset'} autoComplete="email" value={authEmail} onChange={e => { setAuthEmail(sanitizeEmailInput(e.target.value)); setAuthError(''); setResetFeedback(''); }} className={`${inputClass} ${authMode === 'reset' ? 'read-only:opacity-70' : ''}`} placeholder="Seu e-mail" aria-invalid={Boolean(authError)} />
                </div>
              </div>

              {authMode !== 'recover' && (
                <div>
                  <label className={`mb-2 block text-[11px] font-bold uppercase tracking-[.15em] ${labelClass}`}>Senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="Sua senha" />
                    <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {authMode === 'login' && <button type="button" onClick={() => openMode('recover')} className="mt-2 text-xs font-semibold text-[#6d4aff] hover:underline">Esqueci minha senha</button>}
                </div>
              )}

              {(authMode === 'register' || authMode === 'reset') && (
                <div>
                  <label className={`mb-2 block text-[11px] font-bold uppercase tracking-[.15em] ${labelClass}`}>Confirmar senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={authConfirmPassword} onChange={e => setAuthConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirme sua senha" />
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <label className={`flex items-start gap-2 text-[13px] ${mutedTextClass}`}>
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6d4aff]" />
                  <span>
                    Aceito os <button type="button" onClick={() => setLegalDocument('terms')} className="font-semibold text-[#6d4aff] hover:underline">Termos de Uso</button> e a <button type="button" onClick={() => setLegalDocument('privacy')} className="font-semibold text-[#6d4aff] hover:underline">Política de Privacidade</button>.
                  </span>
                </label>
              )}

              <button type="submit" disabled={isLoggingIn} className="mt-2 w-full rounded-xl bg-[#6d4aff] py-3.5 font-bold text-white shadow-[0_12px_24px_rgba(109,74,255,.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#5637e8] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">
                {isLoggingIn ? (authMode === 'recover' ? 'Enviando...' : authMode === 'reset' ? 'Salvando...' : authMode === 'login' ? 'Entrando...' : 'Criando conta...') : (authMode === 'login' ? 'Entrar' : authMode === 'register' ? 'Criar minha conta' : authMode === 'recover' ? 'Enviar link de recuperação' : 'Salvar nova senha')}
              </button>

              {(authMode === 'login' || authMode === 'register') && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[11px] font-medium uppercase tracking-[.18em] text-slate-400">ou</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <button type="button" onClick={handleGoogleLogin} disabled={isLoggingIn} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-[#201735] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-50 active:translate-y-0 disabled:opacity-70">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar com Google
                  </button>
                </>
              )}

              <div className="pt-2 text-center">
                <button type="button" onClick={() => openMode(authMode === 'login' ? 'register' : 'login')} className="text-sm font-bold text-[#6d4aff] hover:underline">
                  {authMode === 'login' ? 'Ainda não tenho conta? Criar conta' : authMode === 'register' ? 'Já tenho uma conta? Entrar' : 'Voltar para entrar'}
                </button>
              </div>
            </form>
          </div>

          <LoginFooter onLegalOpen={setLegalDocument} />
          <LegalDocumentModal document={legalDocument} onClose={() => setLegalDocument(null)} />
        </div>
      </div>
    </div>
  );
}

function LoginFooter({ onLegalOpen }: { onLegalOpen: (document: 'terms' | 'privacy') => void }) {
  const supportEmail = 'mailto:icaroprojetos7@gmail.com?subject=Suporte%20VISTTA&body=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20VISTTA.%0A%0ADescreva%20sua%20d%C3%BAvida%20ou%20problema%3A';
  const instagramUrl = 'https://www.instagram.com/aaxxis7/';
  const linkedinUrl = 'https://www.linkedin.com/in/7icaaro';

  return (
    <footer className="mt-5 w-full text-[10px] text-[#4f3f7e]">
      <div className="grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[#e6def7] pt-5 sm:gap-x-6">
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c4770]">Navegação</h3>
          <div className="space-y-1.5">
            <span className="block"><strong className="font-medium">Dashboard</strong><small className="hidden sm:block text-[#6f6783]">Visão geral da ótica</small></span>
            <span className="block"><strong className="font-medium">Caixa diário</strong><small className="hidden sm:block text-[#6f6783]">Abertura e fechamento</small></span>
            <span className="block"><strong className="font-medium">Clientes e estoque</strong><small className="hidden sm:block text-[#6f6783]">Cadastros e inventário</small></span>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c4770]">Legal</h3>
          <div className="space-y-1.5">
            <button type="button" onClick={() => onLegalOpen('terms')} className="block text-left hover:text-[#6d4aff]"><strong className="font-medium">Termos de uso</strong></button>
            <button type="button" onClick={() => onLegalOpen('privacy')} className="block text-left hover:text-[#6d4aff]"><strong className="font-medium">Política de privacidade</strong></button>
            <a href="mailto:icaroprojetos7@gmail.com?subject=Exclusão%20de%20conta" className="block hover:text-[#6d4aff]"><strong className="font-medium">Exclusão de conta</strong></a>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c4770]">Produto</h3>
          <div className="space-y-1.5">
            <span className="block"><strong className="font-medium">PDV e vendas</strong></span>
            <span className="block"><strong className="font-medium">Orçamentos e OS</strong></span>
            <span className="block"><strong className="font-medium">Financeiro e DRE</strong></span>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c4770]">Suporte</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={12} /> Operacional</div>
            <a href={supportEmail} className="block hover:text-[#6d4aff]"><strong className="font-medium">Gmail</strong><small className="block break-all text-[9px] text-[#6f6783]">icaroprojetos7@gmail.com</small></a>
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="block hover:text-[#d62976]"><strong className="font-medium">Instagram</strong></a>
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="block hover:text-[#0a66c2]"><strong className="font-medium">LinkedIn</strong></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LegalDocumentModal({ document, onClose }: { document: 'terms' | 'privacy' | null; onClose: () => void }) {
  const isTerms = document === 'terms';

  return (
    <ModalBase open={Boolean(document)} onClose={onClose} title={isTerms ? 'Termos de uso' : 'Política de privacidade'} width="max-w-2xl">
      <div className="space-y-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <p className="rounded-xl bg-[#f7f3ff] p-4 text-xs text-[#5a4a75]">Última atualização: 05 de setembro de 2026. Este conteúdo apresenta as condições gerais de uso da plataforma VISTTA.</p>
        {isTerms ? (
          <>
            <section><h3 className="mb-1 font-bold text-slate-900">1. Uso da plataforma</h3><p>A VISTTA é um sistema de gestão para óticas. O acesso é destinado a usuários autorizados pela empresa responsável pela conta, que devem manter seus dados de acesso protegidos.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">2. Responsabilidades da conta</h3><p>A empresa usuária é responsável pelas informações cadastradas, pelos acessos concedidos à equipe e pela conferência dos registros operacionais, financeiros e de clientes.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">3. Uso adequado</h3><p>Não é permitido utilizar a plataforma para atividades ilícitas, tentar acessar dados de terceiros ou interferir na segurança, disponibilidade e funcionamento do serviço.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">4. Propriedade intelectual</h3><p>O sistema VISTTA e seus materiais são utilizados conforme as políticas internas da empresa e da operação da ótica contratante. A plataforma não transfere propriedade de dados nem de conteúdo para terceiros sem autorização.</p></section>
          </>
        ) : (
          <>
            <section><h3 className="mb-1 font-bold text-slate-900">1. Dados tratados</h3><p>A plataforma pode armazenar dados da ótica, usuários, clientes, produtos, vendas, orçamentos, ordens de serviço e informações financeiras inseridas durante a operação.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">2. Finalidade</h3><p>Os dados são utilizados para autenticar usuários, executar as funcionalidades do sistema, manter registros da operação e oferecer suporte técnico.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">3. Segurança e acesso</h3><p>O acesso é controlado por autenticação e permissões. A empresa usuária deve revisar seus usuários e comunicar qualquer suspeita de acesso indevido pelo canal de suporte.</p></section>
            <section><h3 className="mb-1 font-bold text-slate-900">4. Solicitações</h3><p>Para solicitar informações, correções ou exclusão de conta, envie uma mensagem para <a className="font-semibold text-[#6d4aff] hover:underline" href="mailto:icaroprojetos7@gmail.com">icaroprojetos7@gmail.com</a> informando a ótica e o usuário responsável.</p></section>
          </>
        )}
      </div>
    </ModalBase>
  );
}
