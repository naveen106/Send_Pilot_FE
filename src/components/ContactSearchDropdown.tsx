import { contactsApi } from '../api';
import { Contact } from '../types';
import PaginatedSearchDropdown from './PaginatedSearchDropdown';

interface Props {
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}

/** Contact-specific adapter that connects search results to page selection state. */
export default function ContactSearchDropdown({ selectedIds, onToggle }: Props) {
  return (
    <PaginatedSearchDropdown<Contact>
      placeholder="Search contacts by name or email..."
      emptyMessage="No contacts found."
      errorMessage="Unable to search contacts."
      resultLabel="results"
      fetchPage={async (query, page, pageSize) => {
        const response = await contactsApi.getAll(page, pageSize, query);
        return { items: response.data.data.contacts ?? [], total: response.data.data.total ?? 0 };
      }}
      getKey={(contact) => contact.id}
      isSelected={(contact) => selectedIds.has(contact.id)}
      onSelect={(contact) => onToggle(contact.id)}
      renderItem={(contact: Contact, selected) => (
        <div className={`px-4 py-3 flex items-center gap-3 ${selected ? 'bg-violet-500/10' : ''}`}>
          <input type="checkbox" checked={selected} readOnly className="w-3.5 h-3.5 accent-violet-500 pointer-events-none" aria-label={`Select ${contact.email}`} />
          <span className="min-w-0">
            <span className="block text-xs font-medium text-slate-200 truncate">{contact.name || 'Unnamed contact'}</span>
            <span className="block text-[11px] text-slate-500 truncate mt-0.5">{contact.email}</span>
          </span>
        </div>
      )}
    />
  );
}
