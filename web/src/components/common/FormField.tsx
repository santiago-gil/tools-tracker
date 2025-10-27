import { forwardRef, cloneElement, isValidElement } from 'react';
import { ErrorMessage } from './ErrorMessage';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required = false, error, children, className = '', id }, ref) => {
    // Clone the child element and add the id prop if provided
    const childWithId =
      id && isValidElement(children)
        ? cloneElement(children, { id, ...children.props })
        : children;

    return (
      <div ref={ref} className={className}>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-primary mb-1"
        >
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {childWithId}
        {error && <ErrorMessage message={error} {...(id && { id: `${id}-error` })} />}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
