import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { Tool } from '../types';
import { validateToolInput } from '../utils/validate';

interface ToolFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tool: Tool) => void;
  initialData?: Partial<Tool>;
  submitting?: boolean;
}

export function ToolFormModal({
  open,
  onClose,
  onSubmit,
  initialData = {},
  submitting = false,
}: ToolFormModalProps) {
  const [data, setData] = useState<Partial<Tool>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // reset form when initialData changes
  useEffect(() => {
    setData(initialData || {});
    setErrors({});
  }, [initialData]);

  const handleChange = (field: keyof Tool, value: string | string[] | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors } = validateToolInput(data);
    if (!valid) {
      setErrors(errors);
      return;
    }
    onSubmit(data as Tool);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData.platform ? 'Edit Tool' : 'Add Tool'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <input
            value={data.platform || ''}
            onChange={(e) => handleChange('platform', e.target.value)}
            placeholder="e.g. WordPress"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
          {errors.platform && (
            <p className="mt-1 text-sm text-red-600">{errors.platform}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={data.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            <option>Website Backends</option>
            <option>Forms / Booking Tools</option>
            <option>Chat Tools</option>
            <option>User Consent Systems</option>
            <option>Marketing/SEO Companies</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Ops Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Ops Notes</label>
          <textarea
            value={data.ops_notes || ''}
            onChange={(e) => handleChange('ops_notes', e.target.value)}
            rows={3}
            placeholder="Any notes for ops team..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : initialData.platform ? 'Save Changes' : 'Add Tool'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
