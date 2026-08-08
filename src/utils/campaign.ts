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
  const failed = new Set((campaign.failedRecipients ?? []).map((recipient) => recipient.email.trim().toLowerCase()));

  return (campaign.assignedCampaigns ?? [])
    .map((assignment) => assignment.contacts?.email?.trim())
    .filter((email): email is string => {
      if (!email) return false;
      const key = email.toLowerCase();
      if (failed.has(key)) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Returns only successfully delivered recipient addresses for campaign summaries. */
export function getSuccessfulCampaignRecipientEmails(campaign: Campaign): string[] {
  const addresses = (campaign.sentDeliveries ?? []).map((delivery) => delivery.email);
  const seen = new Set<string>();

  return addresses
    .map((email) => email?.trim())
    .filter((email): email is string => {
      if (!email) return false;
      const key = email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
