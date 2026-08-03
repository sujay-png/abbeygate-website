export interface PageLayout {
  id: string;
  name: string;
  image: string;
  miniImage?: string;
  brandingOptions: string[];
  optionalExtras: string[];
  notes?: string;
}

export const internalPageLayoutsData = {
  hero: {
    title: "Internal Page Layouts",
    overline: "RESOURCE GUIDE",
    backgroundImage: "/images/banners/faqbanner.webp",
  },
  diaries: [
    {
      id: "richmond",
      name: "Richmond Page Layouts",
      image: "/images/internal-layout/richmond-pagelayout.webp",
      miniImage: "/images/internal-layout/rich.webp",
      brandingOptions: [
        "Foiling – Recommended",
        "Foiling – 15 different colours available",
        "Embossing",
        "Full colour digital print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Coloured Page Edges",
        "Gold or Silver Corners",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalised Names or Initials",
      ],
      notes: "Bespoke diary pages also available, contact our sales team for further information.",
    },
    {
      id: "dorchester",
      name: "Dorchester Page Layouts",
      image: "/images/internal-layout/richmond-pagelayout.webp",
      miniImage: "/images/internal-layout/rich.webp",
      brandingOptions: [
        "Foiling – Recommended",
        "Foiling – 15 different colours available",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Gold or Silver Corners",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalised Names or Initials",
      ],
      notes: "Bespoke diary pages also available, contact our sales team for further information.",
    },
    {
      id: "dorchester-bicolour",
      name: "Dorchester Bicolour Page Layouts",
      image: "/images/internal-layout/dorchester-bicolour.webp",
      miniImage: "/images/internal-layout/dorchester-mini-bi.webp",
      brandingOptions: [
        "Embossing – Recommended",
        "Foiling – 15 different colours available",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Coloured Page Edges",
        "Gold or Silver Corners",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalised Names or Initials",
      ],
      notes: "Bespoke diary pages also available, contact our sales team for further information.",
    },
    {
      id: "harrogate",
      name: "Harrogate Page Layouts",
      image: "/images/internal-layout/harrogate-diaries.webp",
      miniImage: "/images/internal-layout/harrogate-diaries-mini.webp",
      brandingOptions: [
        "Embossing – Recommended",
        "Foiling – 15 different colours available",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalised Names or Initials",
        "Coloured Page Edges",
        "Gold or Silver Corners",
      ],
      notes: "Bespoke diary pages also available, contact our sales team for further information.",
    },
  ] as PageLayout[],
  notebooks: [
    {
      id: "dorchester-notebook",
      name: "Dorchester Page Layouts",
      image: "/images/internal-layout/dorchester-notebook.webp",
      miniImage: "/images/internal-layout/dorchester-notebook-mini.webp",
      brandingOptions: [
        "Embossing – Recommended",
        "Foiling – 15 different colours available",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Gold or Silver Corners",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalise Names or Initials",
      ],
      notes: "Bespoke notebook pages also available, contact our sales team for further information.",
    },
    {
      id: "harrogate-notebook",
      name: "Harrogate Page Layouts",
      image: "/images/internal-layout/Harrogate-Notebook.webp",
      miniImage: "/images/internal-layout/harrogate-notebook-mini.webp",
      brandingOptions: [
        "Embossing – Recommended",
        "Foiling – 15 different colours available",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalise Names or Initials",
        "Coloured Page Edges",
        "Gold or Silver Corners",
      ],
      notes: "Bespoke notebook pages also available, contact our sales team for further information.",
    },
    {
      id: "lewes-notebook",
      name: "Lewes Page Layouts",
      image: "/images/internal-layout/Lewes-Notebook.webp",
      miniImage: "/images/internal-layout/harrogate-notebook-mini.webp",
      brandingOptions: [
        "Foiling – 15 different colours available",
        "Embossed",
        "Full colour Transfer Print",
        "Silk Screen Print",
        "Decal – up to 4 colours",
      ],
      optionalExtras: [
        "Customer Information Pages",
        "Coloured Page Edges",
        "Gold or Silver Corners",
        "Presentation Cartons",
        "Tissue wrapped With Gift Box",
        "Coloured or Printed Ribbon Marker",
        "Personalise Names or Initials",
      ],
      notes: "Bespoke notebook pages also available, contact our sales team for further information.",
    },
  ] as PageLayout[],
};
