import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

const editorTheme = EditorView.theme({
  '&': { backgroundColor: '#08080d', color: '#e2e8f0', fontSize: '12px' },
  '.cm-content': { minHeight: '280px', padding: '12px 16px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit' },
  '.cm-gutters': { backgroundColor: 'rgba(255,255,255,0.02)', color: '#475569', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(139,92,246,0.06)' },
  '.cm-cursor': { borderLeftColor: '#a78bfa' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(139,92,246,0.3) !important' },
});

/** Reusable CodeMirror wrapper for editable code content. */
export default function CodeEditor({ value, onChange, required = false, placeholder, ariaLabel }: Props) {
  return (
    <div className="relative h-[320px] min-h-[280px] overflow-hidden" data-required={required || undefined}>
      {required && (
        <textarea
          required
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute left-0 top-0 h-px w-px resize-none opacity-0"
        />
      )}
      <CodeMirror
        value={value}
        height="320px"
        minHeight="280px"
        theme={editorTheme}
        extensions={[html()]}
        basicSetup={{ lineNumbers: true, foldGutter: true, dropCursor: true, allowMultipleSelections: true, indentOnInput: true, bracketMatching: true, closeBrackets: true, autocompletion: true, rectangularSelection: true, highlightSelectionMatches: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
        indentWithTab
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={onChange}
      />
    </div>
  );
}
