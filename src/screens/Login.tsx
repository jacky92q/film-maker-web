import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useT } from '../i18n';
import { Button } from '../components/ui';

export default function Login() {
  const { t } = useT();
  const nav = useNavigate();
  const login = useAuth((s) => s.login);
  const guest = useAuth((s) => s.guest);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errInvalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('errWeakPassword'));
      return;
    }
    login(email);
    nav('/home');
  }

  return (
    <div className="min-h-screen bg-bg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#3B1F0A] via-[#7B3F18] to-primary px-6 pb-12 pt-16 text-white"
        style={{ minHeight: 280 }}
      >
        <Clapperboard className="absolute -right-6 top-6 h-40 w-40 text-white/10" />
        <Clapperboard className="absolute -left-10 bottom-0 h-32 w-32 text-white/10" />
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h1 className="mt-6 whitespace-pre-line font-serif text-[30px] font-bold leading-tight">
          {t('loginHeroTitle')}
        </h1>
        <p className="mt-2 text-sm text-white/75">{t('loginHeroSubtitle')}</p>
      </motion.div>

      <div className="mx-auto -mt-6 w-full max-w-[440px] px-5">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={submit}
          className="rounded-2xl bg-surface p-6 shadow-card"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}
          <Field icon={<Mail className="h-[18px] w-[18px]" />} label={t('email')}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent outline-none placeholder:text-text-mid/50"
            />
          </Field>
          <div className="h-3" />
          <Field icon={<Lock className="h-[18px] w-[18px]" />} label={t('password')}>
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent outline-none placeholder:text-text-mid/50"
            />
            <button type="button" onClick={() => setShow(!show)} className="text-text-mid">
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </Field>

          <Button type="submit" className="mt-5 h-[54px] w-full">
            {t('signIn')}
          </Button>

          <div className="my-5 flex items-center gap-3 text-text-mid">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs">{t('orDivider')}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-[54px] w-full"
            onClick={() => {
              guest();
              nav('/home');
            }}
          >
            {t('continueGuest')}
          </Button>

          <p className="mt-5 text-center text-sm text-text-mid">
            {t('dontHaveAccount')}{' '}
            <Link to="/register" className="font-bold text-primary">
              {t('register')}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

export function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text-mid">{label}</span>
      <span className="flex items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 py-3.5 text-text-dark focus-within:border-primary">
        <span className="text-text-mid">{icon}</span>
        {children}
      </span>
    </label>
  );
}
