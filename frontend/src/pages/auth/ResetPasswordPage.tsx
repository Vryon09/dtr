import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import owlMascot from '../../assets/owl-mascot.png';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token. Please request a new reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please request a new reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img
              src={owlMascot}
              alt="Owl Mascot"
              style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Set New Password
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Choose a strong and secure password for your account
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--danger-light)',
              color: 'var(--danger-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--success-light, #dcfce7)',
                color: 'var(--success-text, #166534)',
                marginBottom: '16px',
              }}
            >
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Password Reset Complete
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                width: '100%',
                padding: '12px',
                background: 'var(--primary-600, #4f46e5)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md, 8px)',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || !token}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading || !token}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!token}
              icon={<KeyRound size={18} />}
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            >
              Reset Password
            </Button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
