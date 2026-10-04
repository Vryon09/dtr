import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Plus,
  Pencil,
  Check,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useUpdateSettingsMutation,
  useUpdatePasswordMutation,
} from '../../hooks/useSettingsQueries';
import {
  useInternships,
  useSwitchInternshipMutation,
  useUpdateInternshipMutation,
} from '../../hooks/useInternshipQueries';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CreateInternshipModal } from '../../components/internship/CreateInternshipModal';
import { EditInternshipModal } from '../../components/internship/EditInternshipModal';
import { DeleteInternshipModal } from '../../components/internship/DeleteInternshipModal';
import type { InternshipSummary } from '../../types/internship';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Form state (Name and Email only)
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Internship modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<InternshipSummary | null>(null);
  const [deletingInternship, setDeletingInternship] = useState<InternshipSummary | null>(null);

  const updateSettingsMutation = useUpdateSettingsMutation();
  const updatePasswordMutation = useUpdatePasswordMutation();

  const { data: internships = [], isLoading: isInternshipsLoading } = useInternships();
  const switchMutation = useSwitchInternshipMutation();
  const updateInternshipMutation = useUpdateInternshipMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateSettingsMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setProfileSuccess('Profile account details updated successfully!');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile settings');
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

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleSwitch = async (id: string) => {
    await switchMutation.mutateAsync(id);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    await updateInternshipMutation.mutateAsync({
      id,
      payload: { status: nextStatus },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Settings & Configuration</h1>
        <p className="page-subtitle">
          Manage your account profile, internship target hours, and security preferences.
        </p>
      </div>

      {/* Internship & OJT Profiles Card */}
      <Card>
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary)" />
              Internship & OJT Profiles
            </h3>
            <p className="card-subtitle">
              Manage titles, required target hours, company details, and statuses for each internship
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>New Internship</span>
          </Button>
        </div>

        {isInternshipsLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading internship profiles...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {internships.map((item) => {
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: item.isActive
                      ? '1.5px solid var(--primary)'
                      : '1px solid var(--border-subtle)',
                    background: item.isActive
                      ? 'rgba(59, 130, 246, 0.03)'
                      : 'var(--bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {item.title}
                        </span>
                        {item.isActive && (
                          <span
                            style={{
                              fontSize: '0.725rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--primary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Active Tracking
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.725rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            background: isCompleted
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(100, 116, 139, 0.15)',
                            color: isCompleted ? 'var(--success)' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      {item.companyName && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                          Company: <strong>{item.companyName}</strong>
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '6px 8px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginTop: '8px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-main)',
                          }}
                        >
                          Target: <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.requiredHours} hrs</strong>
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-main)',
                          }}
                        >
                          Rendered: <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.completedHours} hrs</strong>
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-main)',
                          }}
                        >
                          Remaining: <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.remainingHours} hrs</strong>
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-main)',
                          }}
                        >
                          Progress: <strong style={{ color: isCompleted ? 'var(--success)' : 'var(--primary)', fontWeight: 700 }}>{item.progressPercentage}%</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {!item.isActive && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitch(item.id)}
                          isLoading={switchMutation.isPending}
                        >
                          <Check size={13} />
                          <span>Set Active</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        isLoading={updateInternshipMutation.isPending}
                      >
                        <CheckCircle size={13} />
                        <span>{isCompleted ? 'Mark Active' : 'Mark Completed'}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingInternship(item)}
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeletingInternship(item)}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '6px',
                      width: '100%',
                      borderRadius: '3px',
                      background: 'var(--border-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(item.progressPercentage, 100)}%`,
                        background: isCompleted ? 'var(--success)' : 'var(--primary)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Profile Settings Card */}
      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserIcon size={20} color="var(--primary)" />
              Profile Details
            </h3>
            <p className="card-subtitle">Manage your personal identification and account email</p>
          </div>
        </div>

        {profileSuccess && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--success)',
              marginBottom: '16px',
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
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--danger)',
              marginBottom: '16px',
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
              disabled={updateSettingsMutation.isPending}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateSettingsMutation.isPending}
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
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--success)',
              marginBottom: '16px',
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
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--danger)',
              marginBottom: '16px',
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
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={updatePasswordMutation.isPending}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={updatePasswordMutation.isPending}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={updatePasswordMutation.isPending}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="outline"
              isLoading={updatePasswordMutation.isPending}
              icon={<Lock size={18} />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Modals for Internship Management */}
      <CreateInternshipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        suggestedTitle={`Internship ${internships.length + 1}`}
      />

      <EditInternshipModal
        isOpen={Boolean(editingInternship)}
        onClose={() => setEditingInternship(null)}
        internship={editingInternship}
      />

      <DeleteInternshipModal
        isOpen={Boolean(deletingInternship)}
        onClose={() => setDeletingInternship(null)}
        internship={deletingInternship}
        totalInternshipsCount={internships.length}
      />
    </div>
  );
};
