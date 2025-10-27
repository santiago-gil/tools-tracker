import { memo, useState } from 'react';
import { useRouteContext } from '@tanstack/react-router';
import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { User, UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../types';
import { getButtonClasses } from '../../utils/buttonVariants';
import { logError } from '../../utils/errorLogging';
import toast from 'react-hot-toast';

export const UsersPage = memo(function UsersPage() {
  const { auth } = useRouteContext({ from: '/_authenticated/users' });
  const hasPermission = auth.user?.permissions?.manageUsers ?? false;

  // Call hooks unconditionally (React hooks must be called in the same order)
  const { data: users, isLoading, error } = useUsers(hasPermission);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Early return for unauthorized users
  if (!hasPermission) {
    return (
      <div className="layout-main">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-semibold mb-2">Not Authorized</div>
          <p className="text-secondary">You do not have permission to manage users.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (uid: string, role: UserRole) => {
    const newPermissions = ROLE_PERMISSIONS[role];
    await updateUser.mutateAsync({
      uid,
      data: { role, permissions: newPermissions },
    });
  };

  const handleDelete = (user: User) => {
    setPendingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingUser) {
      try {
        await deleteUser.mutateAsync(pendingUser.uid);
        setShowDeleteConfirm(false);
        setPendingUser(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete user');
        // Log error in production for monitoring
        logError(error, {
          action: 'delete_user',
          userId: pendingUser.uid,
          email: pendingUser.email,
        });
        // Keep modal open to allow retry or cancel
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPendingUser(null);
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Failed to load users
        </div>
        <p className="text-secondary">{(error as Error).message}</p>
      </div>
    );
  }

  if (!users?.length) {
    return <div className="text-center py-12 text-tertiary">No users found.</div>;
  }

  return (
    <>
      <div className="layout-main">
        <div className="space-component">
          <h2 className="text-2xl font-semibold text-primary">User Management</h2>
          <p className="mt-1 text-secondary">Manage user roles and permissions.</p>
        </div>

        <div className="elevation-2 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-surface-1">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {users.map((user) => (
                  <tr
                    key={user.uid}
                    className="transition-colors duration-200 bg-surface-0 hover:bg-surface-1"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary">{user.email}</div>
                      <div className="text-xs text-tertiary">{user.uid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.uid, e.target.value as UserRole)
                        }
                        disabled={updateUser.isPending || user.uid === auth.user?.uid} // prevent demotion of self
                        className="text-sm rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[var(--sk-red)] focus:ring-offset-2 bg-surface-1 border-[var(--border-light)] text-primary"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="ops">Ops</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(user.permissions || {})
                          .filter(([, val]: [string, unknown]) => val)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border bg-surface-1 text-secondary border-[var(--border-light)]"
                            >
                              {key}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deleteUser.isPending}
                        className={getButtonClasses('danger', deleteUser.isPending)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDeleteConfirm && pendingUser && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete user "${pendingUser.email}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDestructive
          isLoading={deleteUser.isPending}
        />
      )}
    </>
  );
});
