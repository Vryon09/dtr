import React, { useState } from 'react';
import { User, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { settingsApi } from '../../api/settingsApi';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Form state initialized from current user
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [requiredHours, setRequiredHours] = useState<number>(user?.requiredHours || 300);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      await settingsApi.updateSettings({
        name: name.trim(),
        email: email.trim(),
        requiredHours: Number(requiredHours),
      });
      await refreshUser();
      setProfileSuccess('Profile and OJT target hours updated successfully!');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile settings');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await settingsApi.updatePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
      {/* Top Header */}
      <div className="top-header">
        <div>
          <h1 className="greeting-title">Account Settings</h1>
          <p className="greeting-subtitle">
            Manage your personal profile, OJT hour requirements, and account security
          </p>
        </div>
      </div>

      {/* Profile & Target Hours Form */}
      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--primary)" />
              Profile & Target Hours
            </h3>
            <p className="card-subtitle">Update your personal details and total required OJT hours</p>
          </div>
        </div>

        {profileSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--success-light)',
              color: 'var(--success-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircle size={18} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
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
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={profileLoading}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={profileLoading}
            />
          </div>

          <Input
            label="Required OJT Target Hours"
            type="number"
            min={1}
            max={2000}
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            helperText="Changing target hours recalculates remaining hours and progress metrics"
            required
            disabled={profileLoading}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="primary"
              isLoading={profileLoading}
              icon={<Save size={18} />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password Card */}
      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="var(--primary)" />
              Security & Password
            </h3>
            <p className="card-subtitle">Ensure your account is protected with a strong password</p>
          </div>
        </div>

        {passwordSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--success-light)',
              color: 'var(--success-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircle size={18} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
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
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={passwordLoading}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={passwordLoading}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={passwordLoading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="outline"
              isLoading={passwordLoading}
              icon={<Lock size={18} />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
