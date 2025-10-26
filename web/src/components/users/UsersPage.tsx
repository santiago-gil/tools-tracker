import { memo } from 'react';
import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { User, UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../types';
import { getButtonClasses } from '../../utils/buttonVariants';

export const UsersPage = memo(function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleRoleChange = async (uid: string, role: UserRole) => {
    const newPermissions = ROLE_PERMISSIONS[role];
    await updateUser.mutateAsync({
      uid,
      data: { role, permissions: newPermissions },
    });
  };

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.email}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    await deleteUser.mutateAsync(user.uid);
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
        <p className="text-gray-600 dark:text-gray-300">{(error as Error).message}</p>
      </div>
    );
  }

  if (!users?.length) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-300">
        No users found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          User Management
        </h2>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage user roles and permissions.
        </p>
      </div>

      <div className="elevation-2 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-1)' }}>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  User
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Role
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Permissions
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {users.map((user) => (
                <tr
                  key={user.uid}
                  className="transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--surface-0)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--surface-1)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--surface-0)')
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user.email}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {user.uid}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.uid, e.target.value as UserRole)
                      }
                      disabled={updateUser.isPending || user.role === 'admin'} // prevent demotion of self
                      className="text-sm rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[var(--sk-red)] focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--surface-1)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)',
                      }}
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
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border"
                            style={{
                              backgroundColor: 'var(--surface-1)',
                              color: 'var(--text-secondary)',
                              borderColor: 'var(--border-light)',
                            }}
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
  );
});
