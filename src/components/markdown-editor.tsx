'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit3, Bold, Italic, Link as LinkIcon, List } from 'lucide-react';

type MarkdownEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
};

export function MarkdownEditor({ value, onChange, placeholder, autoFocus }: MarkdownEditorProps) {
    const [isPreview, setIsPreview] = useState(false);

    // Insert markdown syntax at cursor position
    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        title="Bold"
                        type="button"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        title="Italic"
                        type="button"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('[', '](url)')}
                        className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        title="Link"
                        type="button"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => insertMarkdown('- ', '')}
                        className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        title="List"
                        type="button"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Preview Toggle */}
                <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isPreview
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                    type="button"
                >
                    {isPreview ? (
                        <>
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" />
                            Preview
                        </>
                    )}
                </button>
            </div>

            {/* Editor/Preview */}
            <div className="flex-1 overflow-y-auto">
                {isPreview ? (
                    <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
                        {value ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-zinc-400 italic">Nothing to preview</p>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || 'Write your note in markdown...'}
                        autoFocus={autoFocus}
                        className="w-full h-full p-4 bg-transparent border-none outline-none resize-none font-mono text-sm"
                    />
                )}
            </div>
        </div>
    );
}
