import { Save, X } from 'lucide-react';
import { Spinner } from '../../ui/Spinner';

interface FormHeaderProps {
  isEditing: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  onSubmit?: () => void;
}

export function FormHeader({
  isEditing,
  onClose,
  isSubmitting,
  onSubmit,
}: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between p-8 border-b border-[var(--border-light)] shrink-0">
      <h2 className="text-2xl font-semibold text-primary">
        {isEditing ? 'Edit Tool' : 'Add New Tool'}
      </h2>
      <div className="flex items-center gap-3">
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg icon-crisp"
            title={isEditing ? 'Save Changes' : 'Create Tool'}
          >
            {isSubmitting ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 icon-crisp"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
