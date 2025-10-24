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
        className="btn-secondary disabled:opacity-50 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-semibold"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </span>
        ) : isEditing ? (
          'Save Changes'
        ) : (
          'Create Tool'
        )}
      </button>
    </div>
  );
}
