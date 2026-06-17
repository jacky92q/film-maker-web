import { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Mail, Lock, Eye, EyeOff, Sparkles, Film, Wand2 } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useT } from '../i18n';
import { asset } from '../lib/paths';
import { googleConfigured } from '../lib/google';
import GoogleSignIn from '../components/GoogleSignIn';

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
  const [gUnavailable, setGUnavailable] = useState(!googleConfigured());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errInvalidEmail'));
    if (password.length < 6) return setError(t('errWeakPassword'));
    login(email);
    nav('/home');
  }

  const onGoogle = useCallback((p: { name: string; email: string; picture?: string }) => {
    google(p);
    nav('/home');
  }, [google, nav]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand bg-[length:200%_200%] animate-gradient lg:block">
        <motion.div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-white/20 blur-3xl animate-blob" />
        <motion.div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#A86CF0]/40 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <Film className="absolute -right-10 top-24 h-72 w-72 text-white/10" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/login" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <Clapperboard className="h-6 w-6" />
            </div>
            <span className="font-serif text-2xl font-bold">Film Maker</span>
          </Link>

          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
            <motion.h1 variants={fade} className="whitespace-pre-line font-serif text-5xl font-bold leading-[1.08] drop-shadow-sm">
              {t('loginHeroTitle')}
            </motion.h1>
            <motion.p variants={fade} className="mt-5 max-w-md text-lg text-white/90">{t('appTagline')}.</motion.p>
            <motion.div variants={fade} className="mt-10 space-y-4">
              <Feature icon={<Wand2 className="h-5 w-5" />} text="Drag-and-drop editor with cinematic transitions" />
              <Feature icon={<Sparkles className="h-5 w-5" />} text="Animated text, stickers & ambient effects" />
              <Feature icon={<Film className="h-5 w-5" />} text="Export to a seekable MP4 in up to 4K" />
            </motion.div>
          </motion.div>
          <p className="text-sm text-white/60">Make beautiful memory films — right in your browser.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center overflow-hidden bg-bg px-6 py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand shadow-glow">
              <Clapperboard className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-text-dark">{t('signIn')}</h2>
          <p className="mt-1.5 text-sm text-text-mid">{t('loginHeroSubtitle')}</p>

          <div className="mt-7">
            {!gUnavailable && <GoogleSignIn onSuccess={onGoogle} onUnavailable={() => setGUnavailable(true)} />}
            {gUnavailable && (
              <button
                onClick={() => onGoogle({ name: 'Demo User', email: 'demo@filmmaker.app', picture: undefined })}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface px-4 py-3 text-sm font-semibold text-text-dark shadow-sm transition hover:bg-surface-2 active:scale-[0.99]"
                title="Set VITE_GOOGLE_CLIENT_ID to enable real Google login"
              >
                <img src={asset('images/google_logo.svg')} alt="" className="h-5 w-5" />
                {t('signInWithGoogle')}
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-text-mid">demo</span>
              </button>
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-text-mid">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs">{t('orDivider')}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit}>
            {error && <div className="mb-4 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-[13px] text-danger">{error}</div>}
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
            <button type="submit" className="mt-5 w-full rounded-xl bg-brand bg-[length:200%_200%] py-3 text-sm font-bold text-white shadow-elevated transition hover:animate-gradient active:scale-[0.99]">
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

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">{icon}</span>
      <span className="text-sm text-white/90">{text}</span>
    </div>
  );
}

export function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text-mid">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-text-dark transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <span className="text-text-mid">{icon}</span>
        {children}
      </span>
    </label>
  );
}
