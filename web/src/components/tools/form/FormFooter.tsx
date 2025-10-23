interface FormFooterProps {
  isEditing: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

export function FormFooter({ isEditing, isSubmitting, onClose }: FormFooterProps) {
  return (
    <div className="flex justify-end gap-3 p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="btn-secondary disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Tool'}
      </button>
    </div>
  );
}
