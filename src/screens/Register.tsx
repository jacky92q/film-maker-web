import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useT } from '../i18n';
import { Field } from './Login';

export default function Register() {
  const { t } = useT();
  const nav = useNavigate();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errInvalidEmail'));
    if (password.length < 6) return setError(t('errWeakPassword'));
    if (password !== confirm) return setError(t('passwordsDoNotMatch'));
    login(email);
    nav('/home');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-mid hover:text-text-dark">
          <ArrowLeft className="h-4 w-4" /> {t('signIn')}
        </Link>
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark">
          <Clapperboard className="h-6 w-6 text-white" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-text-dark">{t('createAccountTitle')}</h2>
        <p className="mt-1.5 text-sm text-text-mid">{t('registerSubtitle')}</p>

        <form onSubmit={submit} className="mt-7">
          {error && <div className="mb-4 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-[13px] text-danger">{error}</div>}
          <Field icon={<Mail className="h-[18px] w-[18px]" />} label={t('email')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent outline-none" />
          </Field>
          <div className="h-3" />
          <Field icon={<Lock className="h-[18px] w-[18px]" />} label={t('password')}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordHintRegister')} className="w-full bg-transparent outline-none placeholder:text-text-mid/50" />
          </Field>
          <div className="h-3" />
          <Field icon={<Lock className="h-[18px] w-[18px]" />} label={t('confirmPassword')}>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full bg-transparent outline-none" />
          </Field>
          <button type="submit" className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]">
            {t('createAccountButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-mid">
          {t('alreadyHaveAccount')} <Link to="/login" className="font-bold text-primary">{t('signIn')}</Link>
        </p>
      </motion.div>
    </div>
  );
}
