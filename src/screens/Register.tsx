import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useT } from '../i18n';
import { Button } from '../components/ui';
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
    <div className="min-h-screen bg-bg">
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#3B1F0A] via-[#7B3F18] to-primary px-6 pb-12 pt-14 text-white">
        <button onClick={() => nav(-1)} className="mb-6 flex items-center gap-1 text-white/80">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-serif text-[26px] font-bold">{t('createAccountTitle')}</h1>
        <p className="mt-2 text-sm text-white/75">{t('registerSubtitle')}</p>
      </div>

      <div className="mx-auto -mt-6 w-full max-w-[440px] px-5">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="rounded-2xl bg-surface p-6 shadow-card"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}
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

          <Button type="submit" className="mt-5 h-[54px] w-full">
            {t('createAccountButton')}
          </Button>

          <p className="mt-5 text-center text-sm text-text-mid">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-bold text-primary">
              {t('signIn')}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
