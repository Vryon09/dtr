import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import owlMascot from '../../assets/owl-mascot.png';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requiredHours, setRequiredHours] = useState<number>(300);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        requiredHours: Number(requiredHours) || 300,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
            Create Account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Set up your OJT tracker and target hours
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

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            placeholder="Juan Dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            label="Required OJT Target Hours"
            type="number"
            min={1}
            max={2000}
            placeholder="300"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            helperText="Can be adjusted anytime in Settings"
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<UserPlus size={18} />}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            Start Tracking
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
