'use client';

import { useState, useRef } from 'react';
import { Breadcrumb } from '@/components/content';
import { PageHero } from '@/components/content/PageHero';
import { Container } from '@/components/ui/Container';
import { contactData } from '@/data/contact';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitStatus('success');
      formRef.current?.reset();
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-12 bg-white border border-gray-200 rounded-md px-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[13px] tracking-wide";
  const textareaClass = "w-full bg-white border border-gray-200 rounded-md p-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[13px] tracking-wide min-h-[150px] resize-y";

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: contactData.breadcrumb }]} />
      
      <PageHero 
        title={contactData.hero.title}
        overline={contactData.hero.overline}
        backgroundImage={contactData.hero.backgroundImage}
        maxWidthClass="max-w-6xl"
      />
      
      <Container maxWidthClass="max-w-[1500px]" className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          
          {/* Intro Text */}
          <div className="text-center mb-12">
            <p className="text-[14px] md:text-[15px] font-sans text-brand-primary-dark leading-relaxed">
              {contactData.intro}
            </p>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-sans text-brand-primary-dark mb-4">Message Sent Successfully</h3>
              <p className="text-gray-600 text-[15px] mb-8 max-w-md mx-auto">
                Thank you for reaching out! We have received your message and a member of our team will get back to you shortly.
              </p>
              <button 
                onClick={() => setSubmitStatus('idle')}
                className="px-8 h-12 bg-brand-primary text-white text-[13px] font-bold tracking-wide rounded-md hover:bg-brand-primary-dark transition-colors uppercase"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="text" 
                  name="name"
                  placeholder="FULL NAME" 
                  className={inputClass}
                  required
                />
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="PHONE NUMBER" 
                  className={inputClass}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="email" 
                  name="email"
                  placeholder="EMAIL ADDRESS" 
                  className={inputClass}
                  required
                />
                <input 
                  type="text" 
                  name="order_number"
                  placeholder="ORDER NUMBER" 
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="text" 
                  name="company"
                  placeholder="COMPANY NAME" 
                  className={inputClass}
                />
                <input 
                  type="text" 
                  name="rma_number"
                  placeholder="RMA NUMBER" 
                  className={inputClass}
                />
              </div>

              <textarea 
                name="comments"
                placeholder="COMMENTS / QUESTIONS" 
                className={textareaClass}
                required
              ></textarea>

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-md flex items-start gap-3">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-[14px]">{errorMessage}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-brand-primary text-white text-[14px] font-bold tracking-wide rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 uppercase disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          )}

        </div>
      </Container>
    </main>
  );
}
