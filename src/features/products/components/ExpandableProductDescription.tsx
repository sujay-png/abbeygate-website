'use client';

import { useState } from 'react';
import { stripHtml } from '../utils/product-helpers';

type ExpandableProductDescriptionProps = {
  description: string;
  limit?: number;
};

export const ExpandableProductDescription = ({
  description,
  limit = 120,
}: ExpandableProductDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const plainText = stripHtml(description);
  const isLong = plainText.length > limit;

  if (!isLong) {
    return (
      <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
        {plainText}
      </p>
    );
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="text-[13px] text-gray-500 leading-relaxed mb-3">
      {!isExpanded ? (
        <p>
          {plainText.slice(0, limit)}...{' '}
          <button
            onClick={handleToggle}
            className="font-bold text-brand-primary hover:underline ml-1"
          >
            Read more
          </button>
        </p>
      ) : (
        <p>
          {plainText}{' '}
          <button
            onClick={handleToggle}
            className="font-bold text-brand-primary hover:underline ml-1"
          >
            Read less
          </button>
        </p>
      )}
    </div>
  );
};
