'use client';

import { useState, useRef } from 'react';
import { ChevronDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export function EnquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  
  const formRef = useRef<HTMLFormElement>(null);

  // Add custom styles for the PhoneInput to match the design
  const phoneInputStyles = `
    .PhoneInput-custom {
      display: flex;
      align-items: center;
      padding-left: 0 !important;
    }
    .PhoneInput-custom .PhoneInputCountry {
      width: 100px;
      padding-left: 1rem;
      padding-right: 1rem;
      border-right: 1px solid var(--brand-border);
      margin-right: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
    }
    .PhoneInput-custom .PhoneInputCountryIcon {
      width: 24px;
      height: 16px;
    }
    .PhoneInput-custom .PhoneInputInput {
      border: none;
      background: transparent;
      outline: none;
      height: 100%;
      flex: 1;
      color: black;
      font-size: 14px;
      padding-right: 1rem;
    }
    .PhoneInput-custom .PhoneInputCountrySelectArrow {
      width: 0.4em;
      height: 0.4em;
      opacity: 0.5;
    }
  `;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    // Since PhoneInput is a custom component, we can just append its value.
    if (phoneValue) {
      formData.set('phone', phoneValue);
    }

    try {
      const response = await fetch('/api/enquiry', {
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

  const labelClass = "block text-[13px] font-bold text-brand-primary-dark uppercase tracking-wide mb-3";
  const inputClass = "w-full h-[52px] bg-white border border-gray-200 rounded-md px-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[14px]";
  const selectClass = "appearance-none w-full h-[52px] bg-white border border-gray-200 rounded-md px-4 pr-10 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[14px]";
  const textareaClass = "w-full bg-white border border-gray-200 rounded-md p-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[14px] min-h-[120px] resize-y";
  const sectionTitleClass = "text-[18px] font-bold font-sans text-brand-primary-dark mb-6 pb-2 border-b border-gray-100";

  if (submitStatus === 'success') {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-sans text-brand-primary-dark mb-4">Enquiry Submitted Successfully</h3>
        <p className="text-gray-600 text-[15px] mb-8 max-w-md mx-auto">
          Thank you for reaching out! We have received your quote request and a member of our team will get back to you within 1 business day.
        </p>
        <Button onClick={() => setSubmitStatus('idle')}>
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-10">
      <style>{phoneInputStyles}</style>
      
      {/* Contact Details */}
      <div>
        <h3 className={sectionTitleClass}>Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div>
            <label htmlFor="name" className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input type="text" id="name" name="name" required placeholder="Full Name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>Company</label>
            <input type="text" id="company" name="company" placeholder="Company Name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" id="email" name="email" required placeholder="name@company.com" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone Number</label>
            <PhoneInput
              international
              defaultCountry="GB"
              value={phoneValue}
              onChange={setPhoneValue}
              className={`${inputClass} !px-0 PhoneInput-custom`}
              name="phone"
            />
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div>
        <h3 className={sectionTitleClass}>Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div>
            <label htmlFor="material" className={labelClass}>Material Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <select id="material" name="material" required className={selectClass} defaultValue="">
                <option value="" disabled>Select a material...</option>
                <option value="Leather">Leather</option>
                <option value="PU">PU (Polyurethane)</option>
                <option value="Faux Grained Leather">Faux Grained Leather</option>
                <option value="Recycled Leather">Recycled Leather</option>
                <option value="Other">Other (Please specify in notes)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="finish" className={labelClass}>Branding / Finish</label>
            <div className="relative">
              <select id="finish" name="finish" className={selectClass} defaultValue="">
                <option value="" disabled>Select a finish...</option>
                <option value="Embossed/Debossed">Embossed / Debossed</option>
                <option value="Foil Blocked">Foil Blocked</option>
                <option value="1 Colour print">1 Colour Print</option>
                <option value="2 Colour print">2 Colour Print</option>
                <option value="Digital print">Digital Print</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="dimensions" className={labelClass}>Dimensions</label>
            <input type="text" id="dimensions" name="dimensions" placeholder="e.g. A4, A5, Custom size" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className={labelClass}>Quantity <span className="text-red-500">*</span></label>
              <input type="number" id="quantity" name="quantity" required min="1" placeholder="Amount" className={inputClass} />
            </div>
            <div>
              <label htmlFor="dateRequired" className={labelClass}>Date Required</label>
              <input type="date" id="dateRequired" name="dateRequired" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className={sectionTitleClass}>Additional Information</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="notes" className={labelClass}>Project Description / Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              placeholder="Tell us more about your project, specific requirements, or ask any questions..." 
              className={textareaClass}
            ></textarea>
          </div>
        </div>
      </div>

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-md flex items-start gap-3">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-[14px]">{errorMessage}</span>
        </div>
      )}

      <div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto px-10 h-14 bg-brand-primary text-white text-[14px] font-bold tracking-wide rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 uppercase disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Request Quote'
          )}
        </button>
      </div>
    </form>
  );
}
