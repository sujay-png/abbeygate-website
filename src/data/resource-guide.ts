export const resourceGuideData = {
  hero: {
    title: "Home of Quality Diaries,\nNotebooks, and Leather Gifts",
    overline: "RESOURCE GUIDE",
    backgroundImage: "/images/banners/faqbanner.webp",
  },
  sections: [
    {
      id: "introduction",
      title: "Introduction to Book Production",
      content: `
        <p class="mb-4 text-brand-body text-[15px] font-work leading-7">
          Abbeygate Manufacturing Company Ltd is a leading manufacturer based in Walsall UK, providing retail quality diaries, notebooks and leather gifts exclusively for the promotional merchandise industry.
        </p>
        <p class="mb-4 text-brand-body text-[15px] font-work leading-7">
          Abbeygate has evolved into a name synonymous with quality, reliable service, product innovation and value for money. Over the past 30 years we have developed a continually evolving premium, yet affordable, range of diaries, notebooks, journals and leather gifts, using the finest ethically sourced materials. Our overseas factory is accredited with a SMETA PILLAR 4 audit.
        </p>
        <p class="mb-4 text-brand-body text-[15px] font-work leading-7">
          Our UK factory offers made in the UK bespoke manufacturing and full finishing services. We have the craftsmanship skills, knowledge and experience to turn your client’s brief into a must have corporate gift. Whether you are facing a short lead-time or want to develop a truly unique product, we can guide you through the easy step by step process.
        </p>
        <p class="mb-4 text-brand-body text-[15px] font-work leading-7">
          Our team always seek to create powerful marketing messages through our merchandise, whether it is a bespoke diary or notebook with FSC recycled paper or when choosing from our stock range. As your specialist supplier we hold a vast array of colours and materials combined with options for bespoke printed tipped- in pages that will truly reflect your client’s corporate identity.
        </p>
        <p class="mb-8 text-brand-body text-[15px] font-work leading-7">
          Our dedicated team is committed to offering our clients the highest levels of service and communication, ensuring that your project is seamlessly managed every step of the way.
        </p>
      `,
      images: [
        "/images/resources/resource-guide-grid.webp"
      ]
    },
    {
      id: "terminology",
      title: "Terminology in Book Production",
      content: `
        <p class="mb-8 text-brand-body text-[15px] font-work leading-7">
          Understanding the terminology used in book production is essential for navigating the various stages of creating a book. Below, we’ll define some of the most common terms that are crucial for book production, as well as provide a comprehensive glossary to help you familiarise yourself with the jargon.
        </p>
        <div class="space-y-6">
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Gutter :</span> <span >The gutter refers to the inner margin of a book, the space between the two facing pages. It’s essential for ensuring that text doesn’t get lost in the binding. When designing a layout, it’s important to account for the gutter to maintain readability.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Spine :</span> <span >The spine is the edge of the book where the pages are bound together. It is often where the book title, author name, and publisher logo are placed. The spine’s thickness can vary depending on the book’s page count and type of binding.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Signature :</span> <span >A signature is a group of pages that are printed on a single sheet of paper and then folded together. Multiple signatures are stacked and bound to form a book. This term is commonly used in the context of traditional bookbinding processes.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Trim Size :</span> <span >The trim size refers to the final dimensions of a book after it has been printed and trimmed. It determines the width and height of the finished book, which is typically set before printing begins.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Bleed :</span> <span >Bleed is the area of the page that extends beyond the trim line, ensuring that there are no white borders after cutting. It is particularly important for images or backgrounds that reach the edges of the page.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Cover Stock :</span> <span >Cover stock refers to the type of paper used for the book’s cover. It’s usually thicker and more durable than the paper used for the interior pages, offering both protection and aesthetic appeal.</span>
          </p>
          <p class="text-brand-body text-[15px] font-work leading-7">
            <span class="font-bold text-brand-body">Typeface :</span> <span >A typeface is a particular design of type, which includes various fonts, sizes, and styles. The choice of typeface can significantly affect the readability and overall design of a book.</span>
          </p>
        </div>
      `
    },
    {
      id: "binding-types",
      title: "Types of Book Binding",
      content: `
        <p class="mb-6 text-brand-body text-[15px] font-work leading-7">
          Book binding is the process of assembling a book’s pages and attaching them to a cover. Different binding methods are suited for different types of books, budgets, and uses.
        </p>
        <p class="mb-6 text-brand-body text-[15px] font-work leading-7">
          <span class="font-bold">Hardcover Binding :</span> <span >A typeface is a particular design of type, which includes various fonts, sizes, and styles. The choice of typeface can significantly affect the readability and overall design of a book.</span>
        </p>
        
        <div class="relative w-full aspect-[21/9] rounded-sm overflow-hidden mb-8">
          <img src="/images/banners/modern-slavery-grid2.webp" alt="Hardcover Binding" class="object-cover w-full h-full" />
        </div>

        <p class="mb-8 text-brand-body text-[15px] font-work leading-7">
          <span class="font-bold">Paperback Binding :</span> <span >More affordable, using flexible, soft covers. It’s commonly used for novels and mass-market books, offering a lightweight, cost-effective solution.</span>
        </p>
        
        <div class="relative w-full aspect-[21/9] rounded-sm overflow-hidden mb-12">
          <img src="/images/resources/resource-guide-grid2.png" alt="Paperback Binding" class="object-cover w-full h-full" />
        </div>

        <h3 class="text-[22px] md:text-2xl font-bold text-brand-primary-dark font-sans tracking-tight mb-8">Other Binding Types</h3>
      `,
      cards: [
        {
          title: "Spiral Binding",
          description: "Uses a metal or plastic coil to bind pages, great for notebooks or manuals.",
        },
        {
          title: "Saddle Stitching",
          description: "Involves folding and stapling, typically used for smaller booklets or brochures.",
        },
        {
          title: "Perfect Binding",
          description: "Pages are glued to the spine, used for magazines and paperbacks with a flat spine.",
        }
      ],
      subcontent: `
        <p class="mt-8 text-brand-body text-[15px] font-work leading-7">
          Each binding type offers unique benefits, helping you choose the best option based on your book’s design, durability, and budget.
        </p>
      `
    },
    {
      id: "page-layouts",
      title: "Page Layouts and Design",
      content: `
        <p class="mb-8 text-brand-body text-[15px] font-work leading-7">
          Page layout plays a crucial role in book production, influencing readability and the overall visual appeal of the book. Here are the Common Page Layout Styles
        </p>
      `,
      cards: [
        {
          title: "Single-Page Spreads",
          description: "Used for books with focused content, like novels or essays.",
        },
        {
          title: "Two-Page Spreads",
          description: "Common in larger books, allowing more dynamic design.",
        },
        {
          title: "Text-Heavy Layouts",
          description: "Focuses on long-form content, with minimal distractions.",
        }
      ],
      subcontent: `
        <h4 class="mt-8 mb-4 font-bold text-brand-primary-dark text-xl font-sans tracking-tight">Considerations for Layout Design</h4>
        <p class="text-brand-body text-[15px] font-work leading-7">
          When designing a layout, factors like margin settings, font choices, and image placement are essential. Proper margins ensure readability, while font selection and strategic image placement enhance the overall design and flow of the book.
        </p>
      `
    },
    {
      id: "conclusion",
      title: "Conclusion",
      content: `
        <p class="text-brand-body text-[15px] font-work leading-7">
          This guide has covered key aspects of book production, from terminology and binding types to layout design and printing processes. Understanding these elements is essential for creating high-quality books. For those looking to explore more, we’ve provided further resources to deepen your knowledge of book production.
        </p>
      `
    }
  ]
};
