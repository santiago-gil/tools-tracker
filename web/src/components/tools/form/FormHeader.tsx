interface FormHeaderProps {
  isEditing: boolean;
  onClose: () => void;
}

export function FormHeader({ isEditing, onClose }: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between p-8 border-b border-gray-200 shrink-0">
      <h2 className="text-2xl font-bold text-gray-900">
        {isEditing ? 'Edit Tool' : 'Add New Tool'}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition text-2xl"
      >
        ✕
      </button>
    </div>
  );
}
