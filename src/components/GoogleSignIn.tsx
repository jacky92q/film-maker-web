import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, decodeJwt, gsi, loadGsi, type GoogleProfile } from '../lib/google';

// Renders the official Google Sign-In button. When a real Client ID is
// configured it performs genuine Google authentication and returns the user's
// real name/email/avatar. The parent decides what to do on failure.
export default function GoogleSignIn({
  onSuccess,
  onUnavailable,
}: {
  onSuccess: (p: GoogleProfile) => void;
  onUnavailable?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_CLIENT_ID) {
      setFailed(true);
      onUnavailable?.();
      return;
    }
    loadGsi()
      .then(() => {
        if (cancelled) return;
        const id = gsi();
        if (!id || !ref.current) {
          setFailed(true);
          onUnavailable?.();
          return;
        }
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            const profile = decodeJwt(resp.credential);
            if (profile) onSuccess(profile);
          },
        });
        id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
        });
        setReady(true);
      })
      .catch(() => {
        setFailed(true);
        onUnavailable?.();
      });
    return () => {
      cancelled = true;
    };
  }, [onSuccess, onUnavailable]);

  if (failed) return null;
  return (
    <div className="flex justify-center">
      <div ref={ref} style={{ minHeight: ready ? undefined : 0 }} />
    </div>
  );
}
