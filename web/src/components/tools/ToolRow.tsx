import { Badge } from '../common/Badge';
import type { Tool } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ToolRowProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({ tool, onEdit, onDelete }: ToolRowProps) {
  const { user } = useAuth();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {tool.platform}
            </h3>
            {tool.sk_recommended && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                SK Recommended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tool.category}</p>
        </div>

        <div className="flex items-center gap-4 text-sm shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">GTM/Ads:</span>
            <Badge status={tool.gtm_ads_trackable?.status || 'Unknown'}>
              {tool.gtm_ads_trackable?.status || '?'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">GA4:</span>
            <Badge status={tool.ga4_trackable?.status || 'Unknown'}>
              {tool.ga4_trackable?.status || '?'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">MSA:</span>
            <Badge status={tool.msa_tracking?.status || 'Unknown'}>
              {tool.msa_tracking?.status || '?'}
            </Badge>
          </div>

          <div className="hidden md:block w-px h-6 bg-gray-200" />

          <div className="flex items-center gap-2">
            {user?.permissions.edit && (
              <button
                onClick={onEdit}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                Edit
              </button>
            )}
            {user?.permissions.delete && (
              <button
                onClick={onDelete}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {(tool.doc_links?.length || tool.example_sites?.length) && (
        <div className="mt-3 space-y-1">
          {tool.doc_links && tool.doc_links.length > 0 && (
            <div className="text-sm truncate">
              <span className="font-medium text-gray-700">Docs:</span>{' '}
              {tool.doc_links.map((link, idx) => (
                <span key={idx}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {link}
                  </a>
                  {idx < tool.doc_links!.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
          {tool.example_sites && tool.example_sites.length > 0 && (
            <div className="text-sm truncate">
              <span className="font-medium text-gray-700">Examples:</span>{' '}
              {tool.example_sites.join(', ')}
            </div>
          )}
        </div>
      )}

      {tool.wcs_team_considerations && (
        <div className="mt-2 text-sm text-gray-700">
          <span className="font-medium">WCS:</span> {tool.wcs_team_considerations}
        </div>
      )}

      {tool.ops_notes && (
        <div className="mt-2 text-sm text-gray-700">
          <span className="font-medium">Notes:</span> {tool.ops_notes}
        </div>
      )}
    </div>
  );
}
