'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { termsData } from '@/data/terms';
import { privacyData } from '@/data/privacy';
import { returnsData } from '@/data/returns';

export type PolicyType = 'terms' | 'privacy' | 'returns';

type Props = {
  type: PolicyType;
  isOpen: boolean;
  onClose: () => void;
};

export function PolicyModal({ type, isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const data = type === 'terms' ? termsData : type === 'privacy' ? privacyData : returnsData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-brand-primary-dark tracking-tight">{data.title}</h2>
            {data.lastUpdated && <p className="text-[13px] text-gray-500 mt-1">{data.lastUpdated}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="overflow-y-auto overscroll-contain p-6 md:p-8 max-h-[65vh]"
          data-lenis-prevent="true"
        >
          <div className="prose prose-sm max-w-none text-brand-primary-dark">
            {data.intro && (
              <div 
                className="mb-8 leading-relaxed [&>p]:mb-4"
                dangerouslySetInnerHTML={{ __html: data.intro }}
              />
            )}
            
            <div className="space-y-8">
              {data.sections.map((section: any, index: number) => (
                <div key={index} className="leading-relaxed">
                  <h3 className="text-lg font-bold tracking-tight mb-4">{section.title}</h3>
                  <div 
                    className="[&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1 [&>ul>li]:pl-1"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
