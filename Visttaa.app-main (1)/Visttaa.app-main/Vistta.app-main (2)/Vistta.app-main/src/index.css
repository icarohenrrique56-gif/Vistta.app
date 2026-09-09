@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --vistta-ink: #201735;
    --vistta-plum: #30204d;
    --vistta-violet: #6d4aff;
    --vistta-lavender: #eeeaff;
    --vistta-paper: #fbfaf8;
    --vistta-lime: #c6ed76;
    --vistta-surface: #ffffff;
    --vistta-muted-surface: #f1eff5;
    --vistta-border: #e7e1ec;
    --vistta-secondary: #716a7d;
  }

  html { background: var(--vistta-paper); }

  body {
    @apply leading-relaxed;
    background: var(--vistta-paper);
    color: var(--vistta-ink);
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  button, input, select, textarea { font: inherit; }

  button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 3px solid rgba(109, 74, 255, .24);
    outline-offset: 2px;
  }
}

.font-display { font-family: 'Space Grotesk', 'DM Sans', sans-serif; }

.vistta-shell {
  background: radial-gradient(circle at 78% -10%, rgba(238, 234, 255, .95), transparent 33%), var(--vistta-paper);
}

.dark {
  --vistta-paper: #171124;
  --vistta-surface: #211936;
  --vistta-muted-surface: #2a2140;
  --vistta-border: #3d3154;
  --vistta-ink: #f7f4ff;
  --vistta-secondary: #b9afca;
}

.dark body {
  background: var(--vistta-paper);
  color: var(--vistta-ink);
}

.dark .vistta-shell {
  background: radial-gradient(circle at 78% -10%, rgba(109, 74, 255, .16), transparent 33%), var(--vistta-paper);
}

/* Legacy screens still use Tailwind light utility classes. Keep them readable
   until each screen is migrated to the shared theme tokens. */
.dark .vistta-grid .bg-white,
.dark .vistta-grid .bg-white\/80 {
  background-color: var(--vistta-surface) !important;
}

.dark .vistta-grid .bg-slate-50 {
  background-color: var(--vistta-muted-surface) !important;
}

.dark .vistta-grid .border-slate-100,
.dark .vistta-grid .border-slate-200,
.dark .vistta-grid .border {
  border-color: var(--vistta-border) !important;
}

.dark .vistta-grid .divide-slate-50 > :not([hidden]) ~ :not([hidden]) {
  border-color: var(--vistta-border) !important;
}

.dark .vistta-grid .text-slate-900,
.dark .vistta-grid .text-slate-800,
.dark .vistta-grid .text-slate-700 {
  color: var(--vistta-ink) !important;
}

.dark .vistta-grid .text-slate-600,
.dark .vistta-grid .text-slate-500 {
  color: var(--vistta-secondary) !important;
}

.dark .vistta-grid input,
.dark .vistta-grid select,
.dark .vistta-grid textarea {
  color: var(--vistta-ink);
  background-color: var(--vistta-muted-surface);
  border-color: var(--vistta-border);
}

.dark .vistta-grid option {
  color: var(--vistta-ink);
  background-color: var(--vistta-surface);
}

.vistta-grid {
  background-image: linear-gradient(rgba(48, 32, 77, .035) 1px, transparent 1px), linear-gradient(90deg, rgba(48, 32, 77, .035) 1px, transparent 1px);
  background-size: 32px 32px;
}

.vistta-enter { animation: vistta-enter .45s ease-out both; }

.vistta-loading-content { animation: vistta-loading-content .8s ease-out both; }

.vistta-loading-mark::before {
  content: '';
  position: absolute;
  inset: 19%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(43, 111, 255, .2), rgba(43, 111, 255, 0) 68%);
  filter: blur(8px);
}

.vistta-loading-ring {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 999px;
  transform: rotate(-28deg);
}

.vistta-loading-ring-one {
  inset: 12%;
  border-top-color: #2674ff;
  border-right-color: rgba(38, 116, 255, .28);
  animation: vistta-loading-spin 1.8s linear infinite;
}

.vistta-loading-ring-two {
  inset: 20%;
  border-bottom-color: #8c43ff;
  border-left-color: rgba(140, 67, 255, .25);
  animation: vistta-loading-spin-reverse 1.35s linear infinite;
}

.vistta-loading-dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #2674ff;
  animation: vistta-loading-dot 1.1s ease-in-out infinite;
}

.vistta-loading-dot-delay-one { animation-delay: .16s; }
.vistta-loading-dot-delay-two { animation-delay: .32s; }

@keyframes vistta-loading-content {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes vistta-loading-spin { to { transform: rotate(332deg); } }
@keyframes vistta-loading-spin-reverse { to { transform: rotate(-388deg); } }
@keyframes vistta-loading-dot {
  0%, 100% { opacity: .3; transform: translateY(0) scale(.8); }
  50% { opacity: 1; transform: translateY(-3px) scale(1.15); }
}

@keyframes vistta-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

@media (max-width: 767px) {
  html, body, #root { min-height: 100%; }

  .mobile-safe-bottom {
    padding-bottom: calc(70px + env(safe-area-inset-bottom));
  }

  .mobile-bottom-nav {
    height: calc(70px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
  }
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
}
