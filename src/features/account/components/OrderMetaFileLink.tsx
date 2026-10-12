'use client';

import { useState } from 'react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

type Props = {
  url: string;
  label: string;
};

export function OrderMetaFileLink({ url, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-brand-primary hover:underline font-medium text-left inline-flex items-center gap-1 cursor-pointer"
      >
        View File
      </button>

      {isOpen && (
        <ImagePreviewModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          imageUrl={url}
          title={label || 'File Preview'}
        />
      )}
    </>
  );
}
