'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PageLayout } from '@/data/internal-page-layouts';
import { Modal } from '@/components/ui/Modal';
import { Container } from '@/components/ui/Container';

interface PageLayoutViewerProps {
  diaries: PageLayout[];
  notebooks: PageLayout[];
}

export function PageLayoutViewer({ diaries, notebooks }: PageLayoutViewerProps) {
  const [activeDiaryTab, setActiveDiaryTab] = useState(diaries[0].id);
  const [activeNotebookTab, setActiveNotebookTab] = useState(notebooks[0].id);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const activeDiary = diaries.find(d => d.id === activeDiaryTab) || diaries[0];
  const activeNotebook = notebooks.find(n => n.id === activeNotebookTab) || notebooks[0];

  const renderLayoutContent = (layout: PageLayout, category: string) => (
    <div className="mt-8 flex flex-col lg:flex-row gap-12">
      {/* Left side: Main Image */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div 
          className="relative w-full aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setPreviewImage({ src: layout.image, alt: `${category} - ${layout.name}` })}
        >
          <Image
            src={layout.image}
            alt={`${category} - ${layout.name}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={95}
          />
        </div>
      </div>

      {/* Right side: Details */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h3 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight mb-8">
          {category} - {layout.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-black mb-4">Branding Options</h4>
            <ul className="space-y-3">
              {layout.brandingOptions.map((option, idx) => (
                <li key={idx} className="text-[15px] text-[#1F2124]/80 font-work">
                  {option}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-4">Optional Extras</h4>
            <ul className="space-y-3">
              {layout.optionalExtras.map((extra, idx) => (
                <li key={idx} className="text-[15px] text-[#1F2124]/80 font-work">
                  {extra}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {layout.miniImage && (
            <div 
              className="relative w-full max-w-[320px] aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImage({ src: layout.miniImage!, alt: `${category} - ${layout.name} Mini` })}
            >
              <Image
                src={layout.miniImage}
                alt={`${category} - ${layout.name} mini`}
                fill
                className="object-contain"
              />
            </div>
          )}
          {layout.notes && (
            <p className="text-[15px] text-[#1F2124]/80 font-work">
              {layout.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-16 md:py-24 bg-white">
      <Container maxWidthClass="max-w-[1400px]">
        {/* Diaries Section */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight mb-8">
            Choose Your Page Layout
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {diaries.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDiaryTab(tab.id)}
                className={`px-6 py-3 rounded text-sm font-work transition-colors ${
                  activeDiaryTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-[#F4F6F7] text-[#1F2124] hover:bg-gray-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          {renderLayoutContent(activeDiary, "Diaries")}
        </div>

        <div className="border-b border-gray-200 mb-16" />

        {/* Notebooks Section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight mb-8">
            Notebooks
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {notebooks.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveNotebookTab(tab.id)}
                className={`px-6 py-3 rounded text-sm font-work transition-colors ${
                  activeNotebookTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-[#F4F6F7] text-[#1F2124] hover:bg-gray-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          {renderLayoutContent(activeNotebook, "Notebooks")}
        </div>
      </Container>

      {/* Lightbox Modal */}
      <Modal 
        isOpen={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        imageSrc={previewImage?.src || ''}
        imageAlt={previewImage?.alt || ''}
      />
    </section>
  );
}
