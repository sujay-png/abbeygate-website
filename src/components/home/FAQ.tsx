'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Container } from '../ui/Container';

const FAQ_DATA = [
  {
    question: "What types of diaries and notebooks does Abbeygate produce?",
    answer: "Abbeygate produces a wide range of diaries and notebooks to suit various needs. This includes standard stock diaries and notebooks in various sizes and formats, as well as fully customisable options. We offer a variety of cover materials, paper types, and binding styles. Our products cater to both personal and professional use, with options for businesses looking to create branded merchandise."
  },
  {
    question: "Can Abbeygate customise diaries and notebooks with my company logo and branding?",
    answer: "Yes, absolutely! Customisation is one of our specialties. We offer a comprehensive range of customisation options to help you create diaries and notebooks that perfectly represent your brand. This includes logo printing, embossing, debossing, foil stamping, custom covers, personalised inserts, and more. Either upload your logo at checkout, or contact our team to discuss your specific requirements."
  },
  {
    question: "What is the typical turnaround time for orders, especially for custom products?",
    answer: "Turnaround times vary depending on the product and the level of customisation. For standard stock items, we offer express delivery options to ensure you receive your order quickly. Custom orders require more production time, but we work efficiently to deliver your products as soon as possible. We provide estimated delivery times when you place your order, and our customer service team will keep you updated on the progress of your order."
  },
  {
    question: "What is Abbeygate's approach to quality control?",
    answer: "Quality is at the heart of everything we do at Abbeygate. We use high-quality materials and employ skilled craftspeople to ensure our diaries and notebooks meet the highest standards. We have rigorous quality control processes in place throughout the production process here in the UK, from sourcing materials to final inspection. We are committed to delivering durable, well-crafted products that you can be proud to use or distribute."
  },
  {
    question: "How can I contact Abbeygate's customer service team, and what support do you offer?",
    answer: "Our customer service team is here to help! You can contact us by phone, email, or through the contact form on our website. We offer a range of support, including: Helping you choose the right products. Providing quotes and information about customisation options. Assisting with the ordering process. Answering questions about delivery and returns. Addressing any concerns or issues you may have. We are committed to providing excellent customer service and ensuring your experience with Abbeygate is positive and seamless."
  }
];

interface FAQProps {
  hideTitle?: boolean;
  className?: string;
}

export const FAQ = ({ hideTitle = false, className = "bg-brand-light" }: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <Container>
        {!hideTitle && (
          <h2 className="font-josefin text-[26px] font-bold tracking-tight text-black lg:text-[37px] text-center mb-12">
            Frequently Asked Questions
          </h2>
        )}

        <div className="max-w-4xl mx-auto flex flex-col border border-gray-300 rounded-sm">
          {FAQ_DATA.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-300 last:border-b-0"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:bg-black/5 cursor-pointer transition-colors hover:bg-black/5"
              >
                <span className="font-semibold text-black pr-8 text-[15px]">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-black" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 text-gray-700 font-work leading-relaxed text-[15px]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
