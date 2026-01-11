import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";

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
  const { user } = useAuth();
  const { showToast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast("Please sign in to submit a support request", "error");
      return;
    }

    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-support-email", {
        body: {
          subject: contactForm.subject,
          message: contactForm.message,
          userId: user.id,
        },
      });

      if (error) throw error;

      showToast(
        "Support request sent successfully! We'll get back to you soon.",
        "success"
      );
      setContactForm({ subject: "", message: "" });
    } catch (error) {
      console.error("Error sending support request:", error);
      showToast("Failed to send support request. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
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

      {/* Contact Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
            <Icon name="support_agent" className="text-2xl text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contact Support
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Send us a message and we'll get back to you soon.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <Input
              value={contactForm.subject}
              onChange={(e) =>
                setContactForm({ ...contactForm, subject: e.target.value })
              }
              placeholder="Brief description of your issue"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contactForm.message}
              onChange={(e) =>
                setContactForm({ ...contactForm, message: e.target.value })
              }
              placeholder="Please describe your issue in detail..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              disabled={submitting}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your profile information will be automatically included in the support request.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Icon name="hourglass_empty" className="text-lg mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icon name="send" className="text-lg mr-2" />
                  Send Support Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* FAQs Section */}
      <div className="mb-12 mt-12">
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
    </div>
  );
};
