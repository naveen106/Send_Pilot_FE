import { useRef, useState } from 'react';
import { Send, X, Paperclip, Clock, Shuffle } from 'lucide-react';
import { SendMode } from '../../types';
import SendModeMenu from './SendModeMenu';
import DailyLimitField from './DailyLimitField';

interface Props {
  form: { name: string; subject: string; htmlContent: string };
  toInput: string;
  toTags: string[];
  toError: string;
  attachments: File[];
  submitting: boolean;
  sendMode: SendMode;
  showModeMenu: boolean;
  scheduledAt: string;
  dailyLimit: number | '';
  onFormChange: (field: string, value: string) => void;
  onToInputChange: (value: string) => void;
  onToKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onToPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onToBlur: () => void;
  onRemoveTag: (email: string) => void;
  onClearTags: () => void;
  onFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onSendModeSelect: (mode: SendMode) => void;
  onToggleModeMenu: () => void;
  onCloseModeMenu: () => void;
  onScheduledAtChange: (value: string) => void;
  onDailyLimitChange: (value: number | '') => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  onClose: () => void;
}

/** Compose panel for creating a new campaign. */
export default function ComposeForm({
  form, toInput, toTags, toError, attachments, submitting,
  sendMode, showModeMenu, scheduledAt, dailyLimit,
  onFormChange, onToInputChange, onToKeyDown, onToPaste, onToBlur,
  onRemoveTag, onClearTags, onFilesChange, onRemoveAttachment,
  onSendModeSelect, onToggleModeMenu, onCloseModeMenu,
  onScheduledAtChange, onDailyLimitChange, onSubmit, onClose,
}: Props) {
  // Ref to programmatically focus the recipient input when the row area is clicked
  const toInputRef = useRef<HTMLInputElement>(null);
  // Hidden file input triggered by the "Attach" button
  const fileRef = useRef<HTMLInputElement>(null);

  // How many chips to show before collapsing — keeps the row compact with large lists
  const CHIP_LIMIT = 5;
  const [showAllTags, setShowAllTags] = useState(false);
  const visibleTags = showAllTags ? toTags : toTags.slice(0, CHIP_LIMIT);
  const hiddenCount = toTags.length - CHIP_LIMIT;

  return (
    <div className="glass rounded-2xl border border-violet-500/20 mb-6 overflow-hidden">
      {/* Panel header with title and close button */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <Send size={14} className="text-violet-400" /> New Campaign
        </span>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {/* Campaign name field */}
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3">
          <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium">Name *</span>
          <input required placeholder="Campaign name (e.g. Summer Sale 2025)"
            value={form.name} onChange={(e) => onFormChange('name', e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
        </div>

        {/* Recipient tag input — Gmail-style chip input.
            Clicking anywhere in the row focuses the hidden text input.
            Row turns red when there is a validation error. */}
        <div
          className={`px-5 py-2.5 border-b flex items-start gap-3 cursor-text transition-colors ${toError ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.04]'}`}
          onClick={() => toInputRef.current?.focus()}
        >
          <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium mt-1.5">To *</span>
          <div className="flex-1 flex flex-wrap gap-1.5 min-h-[28px]">
            {/* Render each committed email as a removable chip, collapsed beyond CHIP_LIMIT */}
            {visibleTags.map((email) => (
              <span key={email}
                className="inline-flex items-center gap-1 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs rounded-md px-2 py-0.5">
                {email}
                <button type="button" onClick={() => onRemoveTag(email)}
                  className="text-violet-400/60 hover:text-violet-300 transition-colors ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
            {/* Collapse toggle — shown when there are hidden chips */}
            {!showAllTags && hiddenCount > 0 && (
              <button type="button" onClick={() => setShowAllTags(true)}
                className="inline-flex items-center text-[11px] text-violet-400/70 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-0.5 transition-colors">
                +{hiddenCount} more
              </button>
            )}
            {showAllTags && toTags.length > CHIP_LIMIT && (
              <button type="button" onClick={() => setShowAllTags(false)}
                className="inline-flex items-center text-[11px] text-slate-500 hover:text-slate-300 bg-white/5 border border-white/[0.08] rounded-md px-2 py-0.5 transition-colors">
                show less
              </button>
            )}
            {/* Live text input — commits on Enter, comma, Tab, or blur */}
            <input
              ref={toInputRef}
              type="text"
              value={toInput}
              onChange={(e) => onToInputChange(e.target.value)}
              onKeyDown={onToKeyDown}
              onBlur={onToBlur}
              onPaste={onToPaste}
              placeholder={toTags.length === 0 ? 'Add recipients — press Enter, comma or Tab to add' : ''}
              className="bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none min-w-[200px] flex-1 py-0.5"
            />
          </div>
          {toError && <span className="text-[11px] text-red-400 shrink-0 mt-1.5">{toError}</span>}
        </div>
        {/* Recipient count + clear-all shortcut — only shown when tags exist */}
        {toTags.length > 0 && (
          <div className="px-5 py-1.5 border-b border-white/[0.04] flex items-center gap-2">
            <span className="text-[11px] text-slate-600">{toTags.length} recipient{toTags.length > 1 ? 's' : ''}</span>
            <button type="button" onClick={onClearTags}
              className="text-[11px] text-slate-700 hover:text-red-400 transition-colors">clear all</button>
          </div>
        )}

        {/* Email subject field */}
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3">
          <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium">Subject *</span>
          <input required placeholder="Email subject line"
            value={form.subject} onChange={(e) => onFormChange('subject', e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
        </div>

        {/* Email body — plain text / HTML content */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <textarea required placeholder="Write your email body here..."
            rows={8} value={form.htmlContent}
            onChange={(e) => onFormChange('htmlContent', e.target.value)}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none" />
        </div>

        {/* Attachment chips — only rendered when files have been selected */}
        {attachments.length > 0 && (
          <div className="px-5 py-3 border-b border-white/[0.04] flex flex-wrap gap-2">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-300">
                <Paperclip size={11} className="text-slate-500" />
                <span className="max-w-[160px] truncate">{f.name}</span>
                <span className="text-slate-600">({(f.size / 1024).toFixed(0)}KB)</span>
                <button type="button" onClick={() => onRemoveAttachment(i)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contextual info panel for 'scheduled' mode — shows the datetime picker */}
        {sendMode === 'scheduled' && (
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3 bg-amber-500/5">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-400 font-medium shrink-0">Start after</span>
            <input type="datetime-local" value={scheduledAt}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              className="bg-white/5 border border-amber-500/20 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/50 [color-scheme:dark]" />
            <span className="text-[11px] text-slate-600">Sending begins at this time and continues until all recipients are reached.</span>
          </div>
        )}
        {/* Contextual info panel for 'interval' mode — explains the anti-spam behaviour */}
        {sendMode === 'interval' && (
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3 bg-violet-500/5">
            <Shuffle size={13} className="text-violet-400 shrink-0" />
            <span className="text-[11px] text-violet-400 font-medium">Interval Send — emails will be sent at random intervals within your 24-hour limit.</span>
          </div>
        )}

        <div className="px-5 py-2 border-b border-white/[0.04]">
          <DailyLimitField id="campaign-daily-limit" value={dailyLimit} onChange={onDailyLimitChange} />
        </div>

        {/* Footer toolbar: attach button on the left, send mode split-button on the right */}
        <div className="px-5 py-3 flex items-center justify-between">
          {/* Triggers the hidden file input */}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
            <Paperclip size={13} /> Attach
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={onFilesChange} />

          {/* Split-button: left half submits the form, right half opens the mode dropdown */}
          <SendModeMenu
            sendMode={sendMode}
            submitting={submitting}
            open={showModeMenu}
            onToggle={onToggleModeMenu}
            onClose={onCloseModeMenu}
            onSelect={onSendModeSelect}
          />
        </div>
      </form>
    </div>
  );
}
