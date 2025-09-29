import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import type { Tool } from '../types';

interface ToolRowProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
}

export function ToolRow({ tool, onEdit }: ToolRowProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tool.platform}</h3>
          <p className="text-sm text-gray-500">{tool.category}</p>
        </div>
        <div className="flex gap-3 text-sm items-center">
          <Badge status={tool.gtm_ads_trackable?.status ?? 'Unknown'} />
          <Badge status={tool.ga4_trackable?.status ?? 'Unknown'} />
          <Badge status={tool.msa_tracking?.status ?? 'Unknown'} />
          <Button
            variant="secondary"
            className="ml-2 px-2 py-1 text-xs"
            onClick={() => onEdit(tool)}
          >
            Edit
          </Button>
        </div>
      </div>

      {tool.ops_notes && <p className="text-sm text-gray-700">{tool.ops_notes}</p>}

      {tool.doc_links?.length ? (
        <div className="text-sm">
          <span className="font-medium">Docs:</span>{' '}
          {tool.doc_links.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              {url}
            </a>
          ))}
        </div>
      ) : null}

      {tool.example_sites?.length ? (
        <div className="text-sm">
          <span className="font-medium">Examples:</span> {tool.example_sites.join(', ')}
        </div>
      ) : null}
    </Card>
  );
}
