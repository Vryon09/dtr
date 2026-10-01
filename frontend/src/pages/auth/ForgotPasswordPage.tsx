import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import owlMascot from '../../assets/owl-mascot.png';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.');
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
            Forgot Password?
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter your email to receive password reset instructions
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
              Check Your Inbox
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              If an account is associated with <strong>{email}</strong>, we have sent instructions to reset your password.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--primary-600, #4f46e5)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<Mail size={18} />}
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            >
              Send Reset Link
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
