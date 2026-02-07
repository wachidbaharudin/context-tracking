import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { TwoUserSimulator } from './TwoUserSimulator';
import { useTwoUserSimulation } from '../hooks/useTwoUserSimulation';
import type { POCDocument } from '../types/poc-document';

interface RichTextPOCProps {
  doc: POCDocument;
  changeDoc: (fn: (d: POCDocument) => void) => void;
}

/**
 * Parse markdown-style formatting and render as HTML
 * Supports: **bold**, *italic*, __underline__
 */
function parseMarkdownToHtml(text: string): string {
  if (!text) return '';

  // Order matters: process longer patterns first
  const html = text
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Underline: __text__
    .replace(/__(.+?)__/g, '<u>$1</u>')
    // Italic: *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  return html;
}

/**
 * RichTextPOC - Demonstrates rich text formatting concepts with Automerge
 *
 * Note: This POC uses markdown-style markers to simulate rich text formatting.
 * Real Automerge rich text would use the Peritext algorithm with proper marks/spans.
 */
export function RichTextPOC({ doc, changeDoc }: RichTextPOCProps) {
  const [userAInput, setUserAInput] = useState('**bold text**');
  const [userBInput, setUserBInput] = useState('*italic text*');

  const simulation = useTwoUserSimulation<POCDocument>();

  // Parse the rich text to HTML for preview
  const renderedHtml = useMemo(() => parseMarkdownToHtml(doc.richText), [doc.richText]);

  const handleTextChange = (value: string) => {
    changeDoc((d) => {
      d.richText = value;
    });
  };

  const insertFormatting = (marker: string, label: string) => {
    changeDoc((d) => {
      d.richText = d.richText + ` ${marker}${label}${marker}`;
    });
  };

  const handleClear = () => {
    changeDoc((d) => {
      d.richText = '';
    });
  };

  return (
    <div className="space-y-6">
      {/* Educational Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-800 mb-2">About Rich Text in Automerge</h4>
        <p className="text-sm text-blue-700 mb-2">
          Automerge supports rich text with <strong>"marks"</strong> (bold, italic, links, etc.)
          using algorithms inspired by the{' '}
          <a
            href="https://www.inkandswitch.com/peritext/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-800"
          >
            Peritext paper
          </a>
          . Marks are annotations attached to text ranges that survive concurrent edits.
        </p>
        <p className="text-sm text-blue-700">
          This POC demonstrates the concept with a <strong>simplified approach</strong> using
          markdown-style markers (<code className="bg-blue-100 px-1 rounded">**bold**</code>,{' '}
          <code className="bg-blue-100 px-1 rounded">*italic*</code>,{' '}
          <code className="bg-blue-100 px-1 rounded">__underline__</code>). In a real
          implementation, Automerge's <code className="bg-blue-100 px-1 rounded">RichText</code>{' '}
          type would handle overlapping marks and concurrent formatting changes.
        </p>
      </div>

      {/* Rich Text Editor Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Rich Text Editor</h3>

        {/* Formatting Toolbar */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => insertFormatting('**', 'bold')}
            title="Insert bold text"
          >
            <strong>B</strong>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => insertFormatting('*', 'italic')}
            title="Insert italic text"
          >
            <em>I</em>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => insertFormatting('__', 'underline')}
            title="Insert underlined text"
          >
            <u>U</u>
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="secondary" onClick={handleClear}>
            Clear
          </Button>
        </div>

        {/* Text Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rich Text (with markdown markers)
            </label>
            <textarea
              value={doc.richText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={cn(
                'w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'resize-y'
              )}
              placeholder="Type text with **bold**, *italic*, or __underline__ markers..."
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side View: Raw vs Rendered */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Raw Text vs Rendered Preview</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Raw Text */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Raw Text (with markers)</div>
            <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
                {doc.richText || <span className="text-gray-400 italic">(empty)</span>}
              </pre>
            </div>
          </div>

          {/* Rendered Preview */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Rendered Preview</div>
            <div className="p-3 bg-white rounded-md border min-h-[80px]">
              {doc.richText ? (
                <div
                  className="text-sm text-gray-800"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <span className="text-gray-400 italic text-sm">(empty)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formatting Reference */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Formatting Reference</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="font-mono text-gray-600 mb-1">**text**</div>
            <div>
              <strong>Bold</strong>
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="font-mono text-gray-600 mb-1">*text*</div>
            <div>
              <em>Italic</em>
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="font-mono text-gray-600 mb-1">__text__</div>
            <div>
              <u>Underline</u>
            </div>
          </div>
        </div>
      </div>

      {/* Two-User Simulation Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Two-User Simulation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Simulate two users adding formatted text concurrently. User A adds{' '}
          <code className="bg-gray-100 px-1 rounded">**bold text**</code>, User B adds{' '}
          <code className="bg-gray-100 px-1 rounded">*italic text*</code>. After merge, both
          formatting styles are preserved in the document.
        </p>

        <TwoUserSimulator<POCDocument>
          isSimulating={simulation.state.isSimulating}
          userADoc={simulation.state.userA?.doc ?? null}
          userBDoc={simulation.state.userB?.doc ?? null}
          mergedDoc={simulation.state.mergedDoc}
          mergeComplete={simulation.state.mergeComplete}
          onStartSimulation={() => simulation.startSimulation(doc)}
          onMerge={simulation.merge}
          onReset={simulation.reset}
          renderUserAControls={() => (
            <div className="space-y-2">
              <Input
                value={userAInput}
                onChange={(e) => setUserAInput(e.target.value)}
                placeholder="Formatted text to append..."
              />
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserA((d) => {
                    d.richText = d.richText + (d.richText ? ' ' : '') + userAInput;
                  });
                }}
                disabled={!userAInput.trim()}
              >
                Append formatted text
              </Button>
            </div>
          )}
          renderUserBControls={() => (
            <div className="space-y-2">
              <Input
                value={userBInput}
                onChange={(e) => setUserBInput(e.target.value)}
                placeholder="Formatted text to append..."
              />
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserB((d) => {
                    d.richText = d.richText + (d.richText ? ' ' : '') + userBInput;
                  });
                }}
                disabled={!userBInput.trim()}
              >
                Append formatted text
              </Button>
            </div>
          )}
          renderDocState={(simDoc) => (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Raw:</div>
              <div className="text-sm font-mono bg-white p-2 rounded border whitespace-pre-wrap break-words">
                {simDoc.richText || <span className="text-gray-400 italic">(empty)</span>}
              </div>
              <div className="text-xs text-gray-500">Rendered:</div>
              <div className="text-sm bg-white p-2 rounded border">
                {simDoc.richText ? (
                  <span
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(simDoc.richText) }}
                  />
                ) : (
                  <span className="text-gray-400 italic">(empty)</span>
                )}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
