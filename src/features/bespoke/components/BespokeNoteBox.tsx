interface BespokeNoteBoxProps {
  title: string;
  paragraphs: string[];
}

export function BespokeNoteBox({ title, paragraphs }: BespokeNoteBoxProps) {
  return (
    <div className="w-full max-w-[1296px] mx-auto mb-10 md:mb-14 p-6 md:p-8 bg-white/80 rounded-md shadow-sm border border-brand-grey/15">
      <h3 className="text-sm font-bold tracking-wider uppercase text-brand-primary-dark mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="text-[15px] text-brand-body/90 font-work leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

