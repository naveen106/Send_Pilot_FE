import { Campaign } from '../types';

/**
 * Returns the pending recipients assigned to a campaign.
 *
 * The API exposes assignments as relation rows. Keeping this mapping in one
 * place prevents views from accidentally falling back to `campaign.recipients`
 * when the operator explicitly chose an assigned campaign send.
 */
export function getAssignedRecipients(campaign: Campaign): string[] {
  const seen = new Set<string>();

  return (campaign.assignedCampaigns ?? [])
    .map((assignment) => assignment.contacts?.email?.trim())
    .filter((email): email is string => {
      if (!email) return false;
      const key = email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
