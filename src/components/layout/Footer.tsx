"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "../ui/Container";

const FOOTER_LINKS = {
  company: [
    { label: "About Abbeygate", href: "/about" },
    { label: "Our Heritage", href: "/heritage" },
    { label: "Blog", href: "/blog" },
    { label: "Modern Slavery Statement", href: "/modern-slavery" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "Our CSR Policy", href: "/privacy" },
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
    { label: "Artwork Specification", href: "/artwork-specification" },
    { label: "Internal Page Layouts", href: "/internal-page-layouts" },
  ],
};

const TRADE_BROCHURE_URL = "https://simplebooklet.com/abbeygatetradebrochure2027#page=1";

const TradeBrochure = () => {
  return (
    <section className="bg-brand-light border-t border-black border-b border-[#D0DADA] pt-8 pb-8 overflow-hidden">
      <Container>
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-16 lg:gap-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16 xl:gap-24">
            <div className="flex-1 max-w-[720px]">
              <h3 className="text-black text-[30px] font-bold mb-2 font-josefin">
                View our trade brochure
              </h3>

              <p className="text-[#1F2124] text-[15px] leading-8 mb-8 font-work lg:whitespace-nowrap">
                Click the link below to view or download a PDF of our complete diary and
                notebook range.
              </p>

              <a
                href={TRADE_BROCHURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full sm:w-fit text-center bg-[#C8DCDC] border border-black text-black text-[14px] sm:text-[15px] font-work font-medium px-6 sm:px-10 py-4 rounded-md hover:bg-[#C8DCDC] shadow-[0_6px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition-shadow duration-500 ease-out"
              >
                Abbeygate Manufacturing Trade Brochure
              </a>
            </div>

            {/* Right Brochure */}
            <div className="flex justify-center md:justify-end flex-shrink-0">
              <motion.div
                initial={{
                  opacity: 0,
                  y: 120,
                  scale: 0.97,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.45,
                }}
                transition={{
                  duration: 1.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-[220px] md:w-[240px] md:ml-12 lg:ml-20 xl:ml-28"
              >
                <a
                  href={TRADE_BROCHURE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Abbeygate 2027 Collection Trade Brochure"
                  className="block"
                >
                  <Image
                    src="/images/resources/trade-brochure-2027.jpg"
                    alt="Abbeygate 2027 Collection Trade Brochure"
                    width={400}
                    height={565}
                    sizes="(max-width:768px) 220px, 240px"
                    className="w-full h-auto object-contain shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition-shadow duration-500 ease-out hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
                  />
                </a>
              </motion.div>
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
      <footer className="bg-brand-light pt-20 pb-8 overflow-x-hidden">
        <Container>
          {/* Top Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-y-12 gap-x-8 lg:gap-x-10 mb-14">

            <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-5">
              <Link href="/" className="inline-block max-w-[200px]">
                <Image
                  src="/images/logo/abbeygate-logo.png"
                  alt="Abbeygate England"
                  width={220}
                  height={78}
                  className="w-[180px] h-auto object-contain"
                  style={{ height: "auto" }}
                />
              </Link>
              <p className="text-[#666666] text-[15px] font-work leading-7">
                The Home of Quality Diaries,<br />Notebooks and Leather Gifts
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <Image src="/images/icons/cert-made-in-britain.webp" alt="UK Flag" width={50} height={40} className="h-7 sm:h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
                <Image src="/images/icons/cert-bpma.webp" alt="BPMA" width={70} height={40} className="h-7 sm:h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
                <Image src="/images/icons/cert-accredited.webp" alt="Accredited Member" width={90} height={40} className="h-7 sm:h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
                <Image src="/images/icons/cert-sedex.webp" alt="Sedex" width={70} height={30} className="h-5 sm:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-1">
              <h4 className="font-bold text-black font-josefin text-sm tracking-wide mb-3 uppercase">Company</h4>
              <ul className="flex flex-col gap-2">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[15px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links */}
            <div className="lg:col-span-1">
              <h4 className="font-bold text-black font-josefin text-sm tracking-wide mb-3 uppercase">Help</h4>
              <ul className="flex flex-col gap-2">
                {FOOTER_LINKS.help.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[15px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information Links */}
            <div className="lg:col-span-1">
              <h4 className="font-bold text-black font-josefin text-sm tracking-wide mb-3 uppercase">Information</h4>
              <ul className="flex flex-col gap-2">
                {FOOTER_LINKS.information.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#1F2124] text-[15px] hover:text-gray-500 transition-colors font-work">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Address */}
            <div className="lg:col-span-1">
              <h4 className="font-bold text-black font-josefin text-sm tracking-wide mb-3 uppercase">Address</h4>
              <address className="not-italic text-[#1F2124] text-[15px] leading-relaxed font-work">
                Abbeygate<br />
                Graphic House<br />
                Portland Street<br />
                Walsall<br />
                WS2 8AA
              </address>
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-[#D0DADA] w-full" />

          {/* Bottom Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-8">
            <p className="text-[14px] text-black font-work">
              Abbeygate England © 2026
            </p>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[14px] text-black font-work">We accept</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Image src="/images/icons/pay-visa.png" alt="Visa" width={44} height={26} className="h-7 w-auto object-contain" />
                <Image src="/images/icons/pay-mastercard.png" alt="MasterCard" width={44} height={26} className="h-7 w-auto object-contain" />
                <Image src="/images/icons/pay-jcb.png" alt="JCB" width={44} height={26} className="h-7 w-auto object-contain" />
                <Image src="/images/icons/pay-amex.png" alt="American Express" width={44} height={26} className="h-7 w-auto object-contain" />
                <Image src="/images/icons/pay-paypal.png" alt="Paypal" width={64} height={26} className="h-7 w-auto object-contain" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/privacy" className="text-[14px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Privacy Policy</Link>
              <Link href="/terms" className="text-[14px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Terms & Conditions</Link>
              <Link href="/cookies" className="text-[14px] text-black hover:text-gray-600 transition-colors font-work underline underline-offset-4">Cookies Policy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};