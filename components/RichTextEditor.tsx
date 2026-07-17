'use client';

import { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';

// Jodit must only load in the browser.
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
      Loading editor...
    </div>
  ),
});

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, height = 320 }: Props) {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      height,
      placeholder: placeholder || 'Write here...',
      toolbarAdaptive: false,
      buttons:
        'bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,paragraph,|,image,link,table,|,align,undo,redo,|,hr,eraser,fullsize,source',
      uploader: { insertImageAsBase64URI: true },
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
    }),
    [placeholder, height]
  );

  return (
    <div className="jodit-wrapper overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
      />
    </div>
  );
}
