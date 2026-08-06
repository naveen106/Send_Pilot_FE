import { campaignsApi } from '../api';
import { Campaign } from '../types';
import StatusBadge from './StatusBadge';
import PaginatedSearchDropdown from './PaginatedSearchDropdown';

interface Props {
  onSelect?: (campaign: Campaign) => void;
}

/** Campaign-specific adapter for the shared paginated search dropdown. */
export default function CampaignSearchDropdown({ onSelect }: Props) {
  return (
    <PaginatedSearchDropdown<Campaign>
      placeholder="Search campaigns by name or subject..."
      emptyMessage="No campaigns found."
      errorMessage="Unable to search campaigns."
      resultLabel="results"
      fetchPage={async (query, page, pageSize) => {
        const response = await campaignsApi.getAll(page, pageSize, query);
        return { items: response.data.data.campaigns ?? [], total: response.data.data.total ?? 0 };
      }}
      getKey={(campaign) => campaign.id}
      onSelect={(campaign) => onSelect?.(campaign)}
      renderItem={(campaign) => (
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{campaign.name}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{campaign.subject}</p>
              {/* <p className="text-[11px] text-slate-600 truncate mt-1">{htmlToTextPreview(campaign.htmlContent) || 'No campaign content'}</p> */}
            </div>
            <StatusBadge status={campaign.status} />
          </div>
        </div>
      )}
    />
  );
}
