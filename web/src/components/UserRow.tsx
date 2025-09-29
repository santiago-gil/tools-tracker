import { Card } from './Card';
import { Button } from './Button';
import type { User } from '../types';

interface UserRowProps {
  user: User;
  onPromote: (uid: string) => void;
  onDelete: (uid: string) => void;
}

export function UserRow({ user, onPromote, onDelete }: UserRowProps) {
  return (
    <Card className="flex justify-between items-center">
      <div>
        <p className="font-medium">{user.email}</p>
        <p className="text-xs text-gray-500">Role: {user.role}</p>
      </div>
      <div className="flex gap-2">
        {user.role !== 'admin' && (
          <Button variant="secondary" onClick={() => onPromote(user.uid)}>
            Promote to Admin
          </Button>
        )}
        <Button variant="danger" onClick={() => onDelete(user.uid)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
