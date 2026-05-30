import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useBrand } from '@/branding/useBrand';
import { BrandLogo } from '@/branding/BrandLogo';

export const Auth: React.FC = () => {
  const { login, register } = useAuthStore();
  const { showToast } = useUIStore();
  const { activeBrand } = useBrand();
  const [isLoginTab, setIsLoginTab] = useState<boolean>(true);
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }
    if (nickname.length < 3 || nickname.length > 24) {
      setErrorMsg('El nickname debe tener entre 3 y 24 caracteres.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isLoginTab) {
        await login(nickname.trim(), password);
        showToast('¡Bienvenido de nuevo!', 'success');
      } else {
        await register(nickname.trim(), password);
        showToast('¡Registro completado con éxito!', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (isLogin: boolean) => {
    setIsLoginTab(isLogin);
    setErrorMsg(null);
    setNickname('');
    setPassword('');
  };

  return (
    <div
      className="screen active"
      style={{
        background: 'var(--screen-gradient)',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <BrandLogo brand={activeBrand} size={70} />
        </div>
        <h1 className="title-fun" style={{ fontSize: '38px', letterSpacing: '1px', fontWeight: 900 }}>{activeBrand.name}</h1>
        <p className="subtitle-fun" style={{ fontSize: '11px', color: 'var(--cyan)', marginTop: '2px', letterSpacing: '3px' }}>
          {activeBrand.tagline}
        </p>
      </div>

      <div className="card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '2px solid rgba(255,255,255,0.1)' }}>
        {/* Switch tabs */}
        <div className="tabs">
          <div
            className={`tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Ingresar
          </div>
          <div
            className={`tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            Registrarse
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 107, 107, 0.15)',
              border: '2px solid var(--red)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#FFB8B8',
              fontWeight: '700'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                paddingLeft: '4px'
              }}
            >
              Usuario (Nickname)
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej. LeoMessi"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                paddingLeft: '4px'
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn ${isLoginTab ? 'btn-yellow' : 'btn-green'}`}
            disabled={isSubmitting}
            style={{ marginTop: '10px' }}
          >
            {isLoginTab ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>
              {isSubmitting
                ? (isLoginTab ? 'Ingresando...' : 'Registrando...')
                : (isLoginTab ? 'Entrar a Jugar' : 'Crear Cuenta')
              }
            </span>
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
        {activeBrand.footerText}
      </div>
    </div>
  );
};
