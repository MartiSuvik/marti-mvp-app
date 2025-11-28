import React, { useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/Icon";

const faqs = [
  {
    question: "How does matching work?",
    answer:
      "Our matching engine analyzes your onboarding answers (platforms, budget, industry, objectives) and compares them against agency profiles. We generate a match score based on expertise alignment, budget compatibility, industry specialization, and objective fit.",
  },
  {
    question: "How do I book a call with an agency?",
    answer:
      "Click 'View Details' on any agency card in your Deals page, then use the 'Schedule Call' button. This will open the agency's booking calendar or contact form.",
  },
  {
    question: "What information do agencies receive?",
    answer:
      "Agencies receive your company name, industry, ad platforms, spend bracket, and main objectives. We never share sensitive metrics or internal data without your explicit permission.",
  },
  {
    question: "Can I regenerate my matches?",
    answer:
      "Yes! Update your profile in 'My Brand' and click 'Regenerate Matches'. This will create new recommendations based on your updated information.",
  },
  {
    question: "How do I move a deal to Ongoing?",
    answer:
      "In your Deals page, click on a deal card and select 'Move to Ongoing'. This helps you track active partnerships separately from new recommendations.",
  },
  {
    question: "What if I don't see a good match?",
    answer:
      "Browse the Agencies directory to see all verified agencies. You can manually request a match with any agency that interests you, even if they weren't in your top 3 recommendations.",
  },
];

export const Support: React.FC = () => {
  const { showToast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // In a real app, this would send to a backend
    setTimeout(() => {
      showToast(
        "Thank you for your message! We'll get back to you soon.",
        "success"
      );
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Support & Guides
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get help and find answers to common questions
        </p>
      </div>

      {/* FAQs Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              hover
              onClick={() =>
                setExpandedFaq(expandedFaq === index ? null : index)
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  {expandedFaq === index && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {faq.answer}
                    </p>
                  )}
                </div>
                <Icon
                  name={expandedFaq === index ? "expand_less" : "expand_more"}
                  className="text-2xl text-gray-400 ml-4"
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Contact Support
        </h2>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                required
                icon="person"
              />
              <Input
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                required
                icon="email"
              />
            </div>
            <Input
              label="Subject"
              value={contactForm.subject}
              onChange={(e) =>
                setContactForm({ ...contactForm, subject: e.target.value })
              }
              required
              icon="subject"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Message
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                required
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors"
                placeholder="How can we help you?"
              />
            </div>
            <Button type="submit" variant="primary" loading={submitting}>
              Send Message
            </Button>
          </form>
        </Card>
      </div>

      {/* Troubleshooting */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Troubleshooting
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-start gap-3">
              <Icon name="account_circle" className="text-3xl text-primary" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Account Access Issues
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you're having trouble logging in, try resetting your
                  password or contact support using the form above.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <Icon name="verified" className="text-3xl text-primary" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Verification Problems
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Agency verification is automatic. If you see unverified
                  agencies, they're still being processed.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
