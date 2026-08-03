export const artworkData = {
  breadcrumb: "Artwork Specification",
  hero: {
    title: "Artwork Submission Guidelines",
    overline: "ARTWORK",
    backgroundImage: "/images/artwork-footer/artwrk-banner.webp",
  },
  acceptedFormats: {
    title: "Accepted Formats",
    content: `
      <p class="mb-4">All artwork should be supplied in Abode Creative Suite or be Mac compatible and created in CMYK with CMYK values. This will ensure the most accurate colour replication and quality for print. Pantone, Spot or RGB would have to be converted into CMYK format when using digital print which can result in colour matching issues; we there for require all artwork for digital full colour print to be in CMYK format.</p>
      <ul class="list-disc pl-5 mb-4 space-y-1">
        <li>Adobe Illustrator (eps format) – Any version</li>
        <li>Adobe InDesign (INDD format) – Any version</li>
        <li>Adobe Acrobat (pdf format) – Any version</li>
      </ul>
      <p class="mb-4">Please make sure that all the fonts and stoke outlines are created to outlines/paths and / or flattened; this will ensure there are no issues if our font libraries do not match yours when supplying the above formats. Artwork must be created at a minimum of 300 DPI (600 DPI for full colour) and not upscaled after production, this will ensure a clear image.</p>
      <p class="mb-4">Please note that the following formats are not acceptable:</p>
      <p class="mb-4">Coral Draw, PowerPoint, Word, Publisher, HTML, JPG, PSD or Gif files. These software programmes do not create acceptable graphics for printing purposes.</p>
      <p>Please note that in the event of artwork being supplied in the wrong format, with incomplete information or where it does not comply with our guidelines this may cause delays or additional costs and in turn impact on your estimated delivery date. All estimated lead times are from final artwork approval; a formal artwork approval document will be provided and must be approved before we commence any bulk branding.</p>
    `,
    image: "/images/artwork-footer/artwrk-grid1.webp",
    imageAlignment: "right" as const,
  },
  colourSpecifications: {
    title: "Printing And Colour Specifications",
    items: [
      {
        title: "Four Colour Print",
        content: "When your artwork is printed in full colour process it is recommended that you supply us with a colour accurate sample to match to. If a colour sample is not supplied, we will not be held responsible for any possible colour discrepancy.",
        image: "/images/artwork-footer/artwrk-sm-grid1.webp"
      },
      {
        title: "Pantone Colours",
        content: "Print colours and Pantone reference numbers must be clearly specified",
        image: "/images/artwork-footer/artwrk-sm-grid2.png"
      },
      {
        title: "Paper Colour",
        content: "We recommend printing full colour insert pages on white paper as printing on cream paper may result in subtle changes to the final colour result.",
        image: "/images/artwork-footer/artwrk-sm-grid3.webp"
      },
      {
        title: "Trim Marks & Bleeds",
        content: "Ensure artwork includes crop marks and a 3mm bleed if printing to the edge. Keep text within the maximum print area to avoid cutting off content.",
        image: "/images/artwork-footer/artwrk-sm-grid4.webp"
      }
    ]
  },
  pageSizes: {
    title: "Special Matter Page Sizes",
    content: `
      <p class="font-bold mb-2">Standard pocket diary</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 160 x 80 mm</li>
        <li>Maximum Print Area: 148 x 69 mm</li>
        <li>Position of artwork on page: 8mm from spine</li>
      </ul>
      <p class="font-bold mb-2">Standard A5</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 210 x 148 mm</li>
        <li>Maximum Print Area: 190 x 128 mm</li>
        <li>Position of artwork on page: 8mm from spine</li>
      </ul>
      <p class="font-bold mb-2">Standard Quarto</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 257 x 205 mm</li>
        <li>Maximum Print Area: 238 x 185 mm</li>
        <li>Position of artwork on page: 11mm from spine</li>
      </ul>
      <p class="font-bold mb-2">Standard A4</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 297 x 210 mm</li>
        <li>Maximum Print Area: 280 x 190 mm</li>
        <li>Position of artwork on page: 11 mm from spine</li>
      </ul>
      <p class="font-bold mb-2">Spiral pocket</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 160 x 85 mm</li>
        <li>Maximum Print Area: 148 x 72 mm</li>
        <li>Position of artwork on page: 11 mm from spine</li>
      </ul>
      <p class="font-bold mb-2">Spiral Quarto</p>
      <ul class="list-disc pl-5 mb-4 text-sm">
        <li>Trimmed Page Size: 258 x 205 mm</li>
        <li>Maximum Print Area: 238 x 182 mm</li>
        <li>Position of artwork on page: 15 mm from spine</li>
      </ul>
    `,
    image: "/images/artwork-footer/artwrk-grid2.webp",
    imageAlignment: "left" as const,
  },
  guidelinesBox: `
    <h3 class="font-bold text-lg mb-2 text-black">Trim Marks:</h3>
    <p class="mb-6">All special matter page artwork should have a document / page size with crop marks set to the 'trimmed page size', Ex. Set page size to 160 x 80 mm for a standard pocket diary. Keep all text within the 'maximum printed area' to ensure no text or detail is cut off once printed and cropped to insert into the diary. If your artwork has a bleed off the edge of the pages, please be aware that during cropping it may move slightly, so check the position of any crucial text or image to avoid losing detail when cropped. An image that prints off the edge of the paper must have a 3 mm bleed on all sides where the bleed is present.</p>
    
    <h3 class="font-bold text-lg mb-2 text-black">Blocking / Debossing:</h3>
    <p class="mb-4">Front or back cover artwork for blocking or debossing must be supplied as a solid black and white vector graphic file (eps), or high resolution (1200dpi minimum) PSD IE. No colours or tints. The final artwork must be set to the required size IE 100%. Please note: Enlarging the artwork reduces the final quality unless it is a true, vector eps graphic.</p>
    <p class="mb-6">Please note that artwork supplied for blocking or debossing that is of poor quality, as it contains colour or tints, will either be returned or will incur additional charges to be reset as Illustrator eps files. Please note that this delay may impact on your planned production slot and so may adversely affect your estimated delivery date.</p>

    <h3 class="font-bold text-lg mb-2 text-black">Positional Guide:</h3>
    <p class="mb-6">For new and repeat orders, please supply a clear positional guide or accurate measurements for the logo position.</p>

    <h3 class="font-bold text-lg mb-2 text-black">Maximum blocking sizes:</h3>
    <p class="mb-4">The blocking or debossing area may vary slightly depending on the covering material or product dimensions. Our recommended dimensions for diaries and notebooks are:</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <p class="font-bold mb-1">Pocket diaries/notebooks</p>
        <ul class="list-disc pl-5 text-sm mb-4">
          <li>Single cover material: 60 mm wide</li>
          <li>BiColour cover material: 50 mm wide</li>
        </ul>
        <p class="font-bold mb-1">A5 diaries / notebooks</p>
        <ul class="list-disc pl-5 text-sm mb-4">
          <li>All cover materials: 110 mm wide</li>
        </ul>
      </div>
      <div>
        <p class="font-bold mb-1">Quarto diaries/ notebooks</p>
        <ul class="list-disc pl-5 text-sm mb-4">
          <li>Single cover material: 160 mm wide</li>
          <li>BiColour cover material: 140 mm wide</li>
        </ul>
        <p class="font-bold mb-1">A4 diaries / notebooks</p>
        <ul class="list-disc pl-5 text-sm">
          <li>Single cover material: 170 mm wide</li>
          <li>BiColour cover material: 150 mm wide</li>
        </ul>
      </div>
    </div>
    <p class="mb-6">Please note that additional blocking charges will be due if any blocking die is over 10sq cm</p>

    <h3 class="font-bold text-lg mb-2 text-black">Printing of diary pages:</h3>
    <p class="mb-2">The following Pantone Colours are used for the printing of the standard diary pages.</p>
    <ul class="list-disc pl-5 text-sm">
      <li>White Paper: Blue 294 and Grey 431</li>
      <li>Cream Paper: Blue 540 and Burgundy 216</li>
    </ul>
  `,
  approval: {
    title: "Artwork Approval Documents",
    content: `
      <p class="mb-4">Please refer to our terms and conditions and artwork approval document. An artwork approval document will be provided to sign off before bulk branding commences. Please note no changes can be made after this point, the responsibility lies with you as the client to ensure that the artwork, Pantone colours, CMYK vales and position of any artwork is correct and that the product meets your required specifications. Please therefor check very carefully before signing off to proceed to production.</p>
      <p class="mb-4">It is important that you approve the artwork within 24 hours of receipt, delays may impact on your estimated delivery date. Where changes are required to the artwork approval document please notify us by return; once the final approval has been received from you, we can advise of any changes to the delivery date if relevant.</p>
      <p class="mb-6">Please do not hesitate to contact us if you have any questions regarding setting of your artwork. We recommend a sample should be requested before your order commences to ensure you are also happy with the specifications of all elements of your order before bulk production proceeds.</p>
      <p class="font-bold">Tel: 01922 616286</p>
      <p class="font-bold">E-mail: <a href="mailto:sales@madebyabbeygate.com" class="text-rose-400 hover:text-rose-500 underline font-normal">sales@madebyabbeygate.com</a></p>
    `,
    image: "/images/aboutus/about-big-grid4.webp",
    imageAlignment: "left" as const,
  }
};
