'use client';

import { useState } from 'react';
import { stripHtml } from '../utils/product-helpers';

type ExpandableDescriptionProps = {
  description: string;
  limit?: number;
};

export const ExpandableDescription = ({ description, limit = 450 }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const plainText = stripHtml(description);
  const isLong = plainText.length > limit;

  if (!isLong) {
    return (
      <div
        className="prose prose-sm text-brand-body max-w-full [&>p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <div className="prose prose-sm text-brand-body max-w-full [&>p]:leading-relaxed">
      {!isExpanded ? (
        <p>
          {plainText.slice(0, limit)}...{' '}
          <button
            onClick={() => setIsExpanded(true)}
            className="font-bold text-brand-primary hover:underline ml-1"
          >
            Read more
          </button>
        </p>
      ) : (
        <>
          <div dangerouslySetInnerHTML={{ __html: description }} />
          <button
            onClick={() => setIsExpanded(false)}
            className="font-bold text-brand-primary hover:underline mt-2 inline-block"
          >
            Read less
          </button>
        </>
      )}
    </div>
  );
};
