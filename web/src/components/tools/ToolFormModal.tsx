import { useState, useEffect } from 'react';
import type { Tool, TrackableStatus } from '../../types';

interface ToolFormModalProps {
  tool?: Tool | null;
  onClose: () => void;
  onSubmit: (tool: Partial<Tool>) => void;
  isSubmitting: boolean;
}

const CATEGORIES = [
  'Website Backends',
  'Marketing/SEO Companies',
  'User Consent Systems',
  'Forms / Booking Tools',
  'Chat Tools',
];

const STATUSES: TrackableStatus[] = ['Yes', 'No', 'Partial', 'Special', 'Unknown'];

export function ToolFormModal({
  tool,
  onClose,
  onSubmit,
  isSubmitting,
}: ToolFormModalProps) {
  const [formData, setFormData] = useState({
    platform: '',
    category: CATEGORIES[0],
    gtm_status: 'Unknown' as TrackableStatus,
    gtm_notes: '',
    ga4_status: 'Unknown' as TrackableStatus,
    ga4_notes: '',
    msa_status: 'Unknown' as TrackableStatus,
    msa_notes: '',
    doc_links: '',
    example_sites: '',
    wcs_team_considerations: '',
    ops_notes: '',
    sk_recommended: false,
  });

  useEffect(() => {
    if (tool) {
      setFormData({
        platform: tool.platform || '',
        category: tool.category || CATEGORIES[0],
        gtm_status: tool.gtm_ads_trackable?.status || 'Unknown',
        gtm_notes: tool.gtm_ads_trackable?.notes || '',
        ga4_status: tool.ga4_trackable?.status || 'Unknown',
        ga4_notes: tool.ga4_trackable?.notes || '',
        msa_status: tool.msa_tracking?.status || 'Unknown',
        msa_notes: tool.msa_tracking?.notes || '',
        doc_links: tool.doc_links?.join('\n') || '',
        example_sites: tool.example_sites?.join('\n') || '',
        wcs_team_considerations: tool.wcs_team_considerations || '',
        ops_notes: tool.ops_notes || '',
        sk_recommended: tool.sk_recommended || false,
      });
    }
  }, [tool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const toolData: Partial<Tool> = {
      platform: formData.platform,
      category: formData.category,
      gtm_ads_trackable: {
        status: formData.gtm_status,
        notes: formData.gtm_notes || undefined,
      },
      ga4_trackable: {
        status: formData.ga4_status,
        notes: formData.ga4_notes || undefined,
      },
      msa_tracking: {
        status: formData.msa_status,
        notes: formData.msa_notes || undefined,
      },
      doc_links: formData.doc_links
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      example_sites: formData.example_sites
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      wcs_team_considerations: formData.wcs_team_considerations || undefined,
      ops_notes: formData.ops_notes || undefined,
      sk_recommended: formData.sk_recommended,
    };

    onSubmit(toolData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {tool ? 'Edit Tool' : 'Add New Tool'}
          </h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., BentoBox CMS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trackable Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tracking Capabilities
              </h3>

              {/* GTM/Ads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GTM/Ads
                  </label>
                  <select
                    value={formData.gtm_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gtm_status: e.target.value as TrackableStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.gtm_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, gtm_notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              {/* GA4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GA4
                  </label>
                  <select
                    value={formData.ga4_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ga4_status: e.target.value as TrackableStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.ga4_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, ga4_notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              {/* MSA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MSA
                  </label>
                  <select
                    value={formData.msa_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        msa_status: e.target.value as TrackableStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.msa_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, msa_notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documentation Links
                </label>
                <textarea
                  value={formData.doc_links}
                  onChange={(e) =>
                    setFormData({ ...formData, doc_links: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="One link per line..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Example Sites
                </label>
                <textarea
                  value={formData.example_sites}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      example_sites: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="One site per line..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WCS Team Considerations
                </label>
                <textarea
                  value={formData.wcs_team_considerations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wcs_team_considerations: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Special considerations for WCS team..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ops Notes
                </label>
                <textarea
                  value={formData.ops_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, ops_notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Internal notes and considerations..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sk_recommended"
                  checked={formData.sk_recommended}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sk_recommended: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="sk_recommended" className="ml-2 text-sm text-gray-700">
                  SK Recommended
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : tool ? 'Save Changes' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
