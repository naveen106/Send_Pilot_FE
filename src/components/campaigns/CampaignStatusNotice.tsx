import { AlertTriangle, Info } from 'lucide-react';
import { Campaign } from '../../types';

interface Props {
  campaign: Campaign;
}

/** Explains non-terminal send states so quota pauses are not mistaken for failures. */
export default function CampaignStatusNotice({ campaign }: Props) {
  if (campaign.status === 'PAUSED' && campaign.pauseReason === 'DAILY_LIMIT') {
    return (
      <div className="flex items-start gap-2 px-6 py-3 border-b border-amber-500/20 bg-amber-500/[0.06] text-xs text-amber-200">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-400" />
        <p>Sending is paused because the 24-hour send limit was reached. Campaign will auto-resume when daily quota is available. If it doesn't, you can retry the campaign when quota is available.</p>
      </div>
    );
  }

  if (campaign.status === 'FAILED') {
    return (
      <div className="flex items-start gap-2 px-6 py-3 border-b border-red-500/20 bg-red-500/[0.06] text-xs text-red-200">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
        <p>Sending failed because of a delivery or processing error. A reached 24-hour limit is shown as PAUSED instead.</p>
      </div>
    );
  }

  return null;
}
