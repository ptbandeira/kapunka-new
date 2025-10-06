import React from 'react';

interface ContactFormProps {
  className?: string;
}

const combineClassNames = (base: string, extra?: string): string => {
  if (!extra) {
    return base;
  }

  return `${base} ${extra}`.trim();
};

const ContactForm: React.FC<ContactFormProps> = ({ className }) => (
  <form
    name="contact"
    method="POST"
    data-netlify="true"
    netlify-honeypot="bot-field"
    className={combineClassNames('space-y-6', className)}
  >
    <input type="hidden" name="form-name" value="contact" />
    <div className="hidden" aria-hidden="true">
      <label htmlFor="contact-bot-field" className="sr-only">
        Do not fill this field
      </label>
      <input
        id="contact-bot-field"
        name="bot-field"
        className="mt-1 w-full rounded-md border border-stone-300 p-2"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="contact-name" className="text-sm font-medium text-stone-700">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          className="w-full rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-email" className="text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
          placeholder="you@example.com"
        />
      </div>
    </div>
    <div className="space-y-2">
      <label htmlFor="contact-message" className="text-sm font-medium text-stone-700">
        Message
      </label>
      <textarea
        id="contact-message"
        name="message"
        rows={6}
        required
        className="w-full rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
        placeholder="How can we help?"
      />
    </div>
    <div className="flex justify-end">
      <button
        type="submit"
        className="rounded-md bg-stone-900 px-6 py-3 font-semibold text-white transition-colors duration-300 hover:bg-stone-700"
      >
        Send message
      </button>
    </div>
  </form>
);

export default ContactForm;
