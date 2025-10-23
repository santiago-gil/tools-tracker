interface FormFooterProps {
  isEditing: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

export function FormFooter({ isEditing, isSubmitting, onClose }: FormFooterProps) {
  return (
    <div className="flex justify-end gap-3 p-8 border-t border-gray-200 bg-gray-50 shrink-0">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
      >
        {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Tool'}
      </button>
    </div>
  );
}
