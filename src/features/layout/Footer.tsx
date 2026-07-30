import Image from "next/image";
import Link from "next/link";
import { Container } from "../shared/Container";

const FOOTER_LINKS = {
  company: [
    { label: "About Abbeygate", href: "/about" },
    { label: "Our Heritage", href: "/heritage" },
    { label: "Blog", href: "/blog" },
    { label: "Modern Slavery Statement", href: "/modern-slavery" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "Our CSR Policy", href: "/csr" },
  ],
  help: [
    { label: "My Account", href: "/account" },
    { label: "Refund & Returns", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
    { label: "Request a Quote", href: "/quote" },
    { label: "FAQs", href: "/faqs" },
  ],
  information: [
    { label: "Resource Guide", href: "/resource-guide" },
    { label: "Artwork Specification", href: "/artwork" },
    { label: "Internal Page Layouts", href: "/layouts" },
  ],
};

// New section — matches the "View our trade brochure" banner above the footer
const TradeBrochure = () => {
  return (
    <section className="bg-brand-light border-t border-black border-b border-[#D0DADA] pt-18 pb-18">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left: Text + Button */}
          <div className="flex flex-col gap-4 max-w-lg py-4">
            <h3 className="text-black font-bold text-2xl font-sans">
              View our trade brochure
            </h3>
            <p className="text-[#1F2124] text-[14px] font-work leading-relaxed">
              Click the link below to view or download a PDF of our complete
              diary and notebook range.
            </p>
            <a
              href="/downloads/abbeygate-trade-brochure.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 w-fit bg-[#C8DCDC] border border-black text-black text-[14px] font-work font-medium px-6 py-3 rounded-md hover:bg-[#b8cfcf] transition-colors"
            >
              Abbeygate Manufacturing Trade Brochure
            </a>
          </div>

          {/* Right: Brochure Cover Image - Negative Margins for Overlap */}
          <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0 z-20">
            {/* Desktop: overlapping image */}
            <div className="hidden md:block w-[320px] -mt-24 -mb-24 drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500">
              <Image 
                src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Abbeygate-Manufacturing-Trade-Brochure-2027_Page_01-285x400-1.jpg"
                alt="Abbeygate 2027 Collection Trade Brochure"
                width={320}
                height={450}
                className="w-[180px] h-auto object-contain"
              />
            </div>
            
            {/* Mobile fallback (non-overlapping) */}
            <div className="md:hidden w-[220px] drop-shadow-2xl">
              <Image 
                src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Abbeygate-Manufacturing-Trade-Brochure-2027_Page_01-285x400-1.jpg"
                alt="Abbeygate 2027 Collection Trade Brochure"
                width={220}
                height={310}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export const Footer = () => {
  return (
    <>
      <TradeBrochure />
      <footer className="bg-brand-light pt-16 pb-8">
        <Container>
          {/* Top Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-12 xl:gap-8 mb-16">
            
            {/* Logo & Accreditations Column */}
            <div className="xl:col-span-1 flex flex-col gap-6">
              <Link href="/" className="inline-block max-w-[200px]">
                <Image 
                  src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/full-colour.png" 
                  alt="Abbeygate England" 
                  width={200} 
                  height={70} 
                  className="w-[180px] h-auto object-contain"
                />
              </Link>
              <p className="text-[#666666] text-[13px] font-work leading-relaxed">
                The Home of Quality Diaries,<br />Notebooks and Leather Gifts
              </p>
              <div className="flex items-center gap-4 mt-6 flex-wrap">
                <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Union_Jack.webp" alt="UK Flag" width={60} height={40} className="h-8 w-auto object-contain" />
                <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/bpma_logo-1.webp" alt="BPMA" width={80} height={40} className="h-8 w-auto object-contain" />
                <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/accredited_member_logo.webp" alt="Accredited Member" width={100} height={40} className="h-8 w-auto object-contain" />
                <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/sedex_seeklogo.webp" alt="Sedex" width={80} height={40} className="h-8 w-auto object-contain" />
              </div>
            </div>

            {/* Company Links */}
            <div className="xl:col-span-1">
              <h4 className="font-bold text-black font-sans text-sm tracking-wide mb-6 uppercase">Company</h4>
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[14px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links */}
            <div className="xl:col-span-1">
              <h4 className="font-bold text-black font-sans text-sm tracking-wide mb-6 uppercase">Help</h4>
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.help.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[14px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information Links */}
            <div className="xl:col-span-1">
              <h4 className="font-bold text-black font-sans text-sm tracking-wide mb-6 uppercase">Information</h4>
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.information.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[14px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Address */}
            <div className="xl:col-span-1">
              <h4 className="font-bold text-black font-sans text-sm tracking-wide mb-6 uppercase">Address</h4>
              <address className="not-italic text-[#1F2124] text-[14px] leading-relaxed font-work">
                Abbeygate<br />
                Graphic House<br />
                Portland Street<br />
                Walsall<br />
                WS2 8AA
              </address>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#D0DADA] w-full mb-8" />

          {/* Bottom Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <p className="text-[12px] text-gray-500 font-work">
              Abbeygate England © 2026
            </p>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-500 font-work mr-2">We accept</span>
              <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Visa.png" alt="Visa" width={32} height={20} className="h-5 w-auto object-contain" />
              <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/MasterCard.png" alt="MasterCard" width={32} height={20} className="h-5 w-auto object-contain" />
              <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/JCB.png" alt="JCB" width={32} height={20} className="h-5 w-auto object-contain" />
              <Image src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Paypal.png" alt="Paypal" width={45} height={20} className="h-5 w-auto object-contain" />
            </div>

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-[12px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Privacy Policy</Link>
              <Link href="/terms" className="text-[12px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Terms & Conditions</Link>
              <Link href="/cookies" className="text-[12px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Cookies Policy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};
