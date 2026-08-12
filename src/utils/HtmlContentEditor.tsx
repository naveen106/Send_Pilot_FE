import { useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Eye, WandSparkles } from 'lucide-react';
import { formatHtml } from './formatHtml';
import {
  buildEmailPreviewDocument,
  deriveHtmlDraft,
  deriveTextDraft,
  hasHtmlMarkup,
  htmlToPlainText,
  resolveEmailBody,
} from './htmlToPlainText';
import CodeEditor from '../components/common/CodeEditor';

type EditorTab = 'HTML' | 'text' | 'preview';

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * Email body authoring with three views over one send payload:
 * - Code: HTML source (used for send + preview when it contains markup)
 * - Text: plain-text extraction of the HTML, or the body when Code is empty
 * - Preview: always renders exactly what will be sent
 */
export default function HtmlContentEditor({ value, onChange, required = false }: Props) {
  const [tab, setTab] = useState<EditorTab>('HTML');
  const [htmlDraft, setHtmlDraft] = useState(() => deriveHtmlDraft(value));
  const [textDraft, setTextDraft] = useState(() => deriveTextDraft(value));
  const [formatting, setFormatting] = useState(false);

  // Refs mirror drafts so tab switches always read the latest value, even inside
  // handlers that were created on an earlier render.
  const htmlDraftRef = useRef(htmlDraft);
  const textDraftRef = useRef(textDraft);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    htmlDraftRef.current = htmlDraft;
  }, [htmlDraft]);

  useEffect(() => {
    textDraftRef.current = textDraft;
  }, [textDraft]);

  // Apply external prefills/resets without clobbering an in-progress local edit
  // that already matches what we last emitted.
  useEffect(() => {
    if (value === lastEmittedRef.current) return;

    const nextHtml = deriveHtmlDraft(value);
    const nextText = deriveTextDraft(value);
    setHtmlDraft(nextHtml);
    setTextDraft(nextText);
    htmlDraftRef.current = nextHtml;
    textDraftRef.current = nextText;
    lastEmittedRef.current = value;
  }, [value]);

  function emit(nextHtml: string, nextText: string) {
    const payload = resolveEmailBody(nextHtml, nextText);
    lastEmittedRef.current = payload;
    onChange(payload);
  }

  function handleCodeChange(nextHtml: string) {
    setHtmlDraft(nextHtml);
    htmlDraftRef.current = nextHtml;

    if (hasHtmlMarkup(nextHtml)) {
      // Keep Text in lockstep with Code so switching tabs never shows a stale body.
      const plain = htmlToPlainText(nextHtml);
      setTextDraft(plain);
      textDraftRef.current = plain;
      emit(nextHtml, plain);
      return;
    }

    if (!nextHtml.trim()) {
      // Code cleared → plain Text (if any) becomes the send payload.
      emit('', textDraftRef.current);
      return;
    }

    // Partial/non-markup input in Code still counts as the working body.
    emit(nextHtml, textDraftRef.current);
  }

  function handleTextChange(nextText: string) {
    setTextDraft(nextText);
    textDraftRef.current = nextText;

    // Plain-text authoring only drives send when Code has no HTML markup.
    // While HTML exists, Text is a derived read of that HTML (refreshed on tab open).
    if (!hasHtmlMarkup(htmlDraftRef.current)) {
      setHtmlDraft('');
      htmlDraftRef.current = '';
      emit('', nextText);
    }
  }

  function openTab(next: EditorTab) {
    if (next === 'text') {
      const html = htmlDraftRef.current;
      if (hasHtmlMarkup(html)) {
        const plain = htmlToPlainText(html);
        setTextDraft(plain);
        textDraftRef.current = plain;
      }
    }
    setTab(next);
  }

  async function handleFormat() {
    const html = htmlDraftRef.current;
    if (!html.trim() || formatting) return;

    setFormatting(true);
    try {
      const formatted = await formatHtml(html);
      setHtmlDraft(formatted);
      htmlDraftRef.current = formatted;
      const plain = htmlToPlainText(formatted);
      setTextDraft(plain);
      textDraftRef.current = plain;
      emit(formatted, plain);
    } finally {
      setFormatting(false);
    }
  }

  // Preview always reflects the resolved send payload — never a stale tab-local copy.
  const sendBody = useMemo(
    () => resolveEmailBody(htmlDraft, textDraft),
    [htmlDraft, textDraft],
  );
  const previewDocument = useMemo(
    () => buildEmailPreviewDocument(sendBody),
    [sendBody],
  );

  const htmlDrivesSend = hasHtmlMarkup(htmlDraft);
  const bodyRequiredMissing = required && !sendBody.trim();

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-[#08080d] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openTab('HTML')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${tab === 'HTML' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Code2 size={13} /> HTML
          </button>
          <button
            type="button"
            onClick={() => openTab('text')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${tab === 'text' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-[12px] leading-none">T</span> Text
          </button>
          <button
            type="button"
            onClick={() => openTab('preview')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${tab === 'preview' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
        {tab === 'HTML' && (
          <button
            type="button"
            onClick={handleFormat}
            disabled={!htmlDraft.trim() || formatting}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <WandSparkles size={12} /> {formatting ? 'Formatting...' : 'Format HTML'}
          </button>
        )}
      </div>

      {/*
        Keep both editors mounted and only hide inactive ones. Unmounting CodeMirror
        on every tab switch made it easy for React state and the visible document to
        drift apart, which left Text/Preview on an older body.
      */}
      <div className={tab === 'HTML' ? 'block' : 'hidden'}>
        <CodeEditor
          value={htmlDraft}
          onChange={handleCodeChange}
          placeholder={"<table>\n  <tr>\n    <td>Your message</td>\n  </tr>\n</table>"}
          ariaLabel="Email HTML code editor"
        />
      </div>

      <div className={tab === 'text' ? 'block' : 'hidden'}>
        <textarea
          value={textDraft}
          onChange={(event) => handleTextChange(event.target.value)}
          readOnly={htmlDrivesSend}
          rows={12}
          placeholder={
            htmlDrivesSend
              ? 'Plain-text version of your HTML (auto-updated from Code)'
              : 'Write your plain-text email message here...'
          }
          aria-label="Plain-text email content"
          className={`block min-h-[280px] w-full resize-y bg-transparent px-4 py-3 text-[12px] leading-6 text-slate-200 placeholder-slate-700 outline-none ${htmlDrivesSend ? 'cursor-default text-slate-400' : ''}`}
        />
        {htmlDrivesSend && (
          <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-slate-600">
            Code has HTML, so Text shows the extracted plain text and stays read-only.
            Clear the Code tab to write and send a plain-text email instead.
          </p>
        )}
      </div>

      {tab === 'preview' && (
        <iframe
          title="Email content preview"
          srcDoc={previewDocument}
          sandbox=""
          className="block h-[320px] w-full bg-white"
        />
      )}

      {/* Single native constraint so either Code or Text can satisfy Body *. */}
      {required && (
        <textarea
          required={bodyRequiredMissing}
          tabIndex={-1}
          aria-hidden="true"
          value={sendBody}
          onChange={() => undefined}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}
    </div>
  );
}
