import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { listUsers, updateUser, deleteUser } from '../api/users';
import type { User } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { UserRow } from '../components/UserRow';
import { useAuth } from '../context/AuthProvider';

export default function UsersPage() {
  const { user } = useAuth();

  // Block unauthorized
  if (!user) return <ErrorState error={{ message: 'Not signed in' }} />;
  if (user.role !== 'admin') {
    return <ErrorState error={{ message: 'Unauthorized — Admins only' }} />;
  }

  const query = useApiQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const promote = useApiMutation(
    (payload: { uid: string; role: User['role'] }) =>
      updateUser(payload.uid, { role: payload.role }),
    { onSuccess: () => query.refetch() },
  );

  const del = useApiMutation(deleteUser, {
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingSpinner />;
  if (query.isError) return <ErrorState error={query.error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Users</h1>

      {query.data?.length ? (
        query.data.map((u: User) => (
          <UserRow
            key={u.uid}
            user={u}
            onPromote={(uid) => promote.mutate({ uid, role: 'admin' })}
            onDelete={(uid) => del.mutate(uid)}
          />
        ))
      ) : (
        <p className="text-gray-500 text-center py-6">No users found.</p>
      )}
    </div>
  );
}
