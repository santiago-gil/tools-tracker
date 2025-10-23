import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { User, UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../types';

export function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      const newPermissions = ROLE_PERMISSIONS[role];
      await updateUser.mutateAsync({
        uid,
        data: { role, permissions: newPermissions },
      });
    } catch (err) {
      console.error('Failed to update user role', err);
    }
  };

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.email}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.uid);
    } catch (err) {
      console.error('Failed to delete user', err);
    }
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
        <p className="text-gray-600">{(error as Error).message}</p>
      </div>
    );
  }

  if (!users?.length) {
    return <div className="text-center py-12 text-gray-600">No users found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">Manage user roles and permissions.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">{user.uid}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.uid, e.target.value as UserRole)
                      }
                      disabled={updateUser.isPending || user.role === 'admin'} // prevent demotion of self
                      className="text-sm border-gray-300 rounded-lg focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="ops">Ops</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(user.permissions || {})
                        .filter(([, val]) => val)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize"
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
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
}
