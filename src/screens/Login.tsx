import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Mail, Lock, Eye, EyeOff, Sparkles, Film, Wand2 } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useT } from '../i18n';
import { asset } from '../lib/paths';

export default function Login() {
  const { t } = useT();
  const nav = useNavigate();
  const login = useAuth((s) => s.login);
  const guest = useAuth((s) => s.guest);
  const google = useAuth((s) => s.loginWithGoogle);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errInvalidEmail'));
    if (password.length < 6) return setError(t('errWeakPassword'));
    login(email);
    nav('/home');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2A1408] via-[#7B3F18] to-primary lg:block">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <Film className="absolute -right-10 top-10 h-72 w-72 text-white/5" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/login" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Clapperboard className="h-6 w-6" />
            </div>
            <span className="font-serif text-2xl font-bold">Film Maker</span>
          </Link>

          <div>
            <h1 className="whitespace-pre-line font-serif text-5xl font-bold leading-[1.1]">{t('loginHeroTitle')}</h1>
            <p className="mt-5 max-w-md text-lg text-white/80">{t('appTagline')}.</p>
            <div className="mt-10 space-y-4">
              <Feature icon={<Wand2 className="h-5 w-5" />} text="Drag-and-drop editor with cinematic transitions" />
              <Feature icon={<Sparkles className="h-5 w-5" />} text="Animated text, stickers & ambient effects" />
              <Feature icon={<Film className="h-5 w-5" />} text="Export to MP4 in 720p, 1080p or 4K" />
            </div>
          </div>

          <p className="text-sm text-white/50">Make beautiful memory films — right in your browser.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-bg px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark">
              <Clapperboard className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-text-dark">{t('signIn')}</h2>
          <p className="mt-1.5 text-sm text-text-mid">{t('loginHeroSubtitle')}</p>

          <button
            onClick={() => { google(); nav('/home'); }}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-text-dark shadow-sm transition hover:bg-surface-2 active:scale-[0.99]"
          >
            <img src={asset('images/google_logo.svg')} alt="" className="h-5 w-5" />
            {t('signInWithGoogle')}
          </button>

          <div className="my-5 flex items-center gap-3 text-text-mid">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs">{t('orDivider')}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit}>
            {error && (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-[13px] text-danger">{error}</div>
            )}
            <Field icon={<Mail className="h-[18px] w-[18px]" />} label={t('email')}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent outline-none placeholder:text-text-mid/50" />
            </Field>
            <div className="h-3" />
            <Field icon={<Lock className="h-[18px] w-[18px]" />} label={t('password')}>
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent outline-none placeholder:text-text-mid/50" />
              <button type="button" onClick={() => setShow(!show)} className="text-text-mid">
                {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </Field>

            <button type="submit" className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]">
              {t('signIn')}
            </button>
          </form>

          <button onClick={() => { guest(); nav('/home'); }} className="mt-3 w-full rounded-xl border border-line py-3 text-sm font-semibold text-text-mid transition hover:bg-surface-2">
            {t('continueGuest')}
          </button>

          <p className="mt-6 text-center text-sm text-text-mid">
            {t('dontHaveAccount')} <Link to="/register" className="font-bold text-primary">{t('register')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">{icon}</span>
      <span className="text-sm text-white/85">{text}</span>
    </div>
  );
}

export function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text-mid">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-text-dark focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <span className="text-text-mid">{icon}</span>
        {children}
      </span>
    </label>
  );
}
