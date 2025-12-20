import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon";

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Why should I choose ScalingAd?",
      answer:
        "ScalingAd removes the guesswork from finding an agency. Our AI-powered matching considers your specific needs—budget, platforms, industry, and goals—to connect you with agencies that have proven success in your exact situation. Plus, our escrow system protects your investment.",
    },
    {
      question: "What's my guarantee as a business?",
      answer:
        "Your funds are held in escrow until work is delivered and approved. If an agency doesn't meet the agreed deliverables, you get your money back. We also verify all agencies before they join our network, checking their track record, client reviews, and actual results.",
    },
    {
      question: "How does the matching work?",
      answer:
        "Our algorithm analyzes your onboarding answers—platforms, budget, industry, and objectives—and matches you with agencies that have proven expertise in those areas. You get 3 top matches with fit scores.",
    },
    {
      question: "How long does onboarding take?",
      answer:
        "Just 5 minutes. We ask only strategic questions—no sensitive metrics or lengthy forms. Answer questions about your ad operations, spend bracket, objectives, and industry.",
    },
    {
      question: "Are the agencies verified?",
      answer:
        "Yes, all agencies in our network are vetted for quality, performance, and expertise. We verify their capabilities, past work, and client results before adding them to the platform.",
    },
    {
      question: "What if I don't like my matches?",
      answer:
        "You can browse our full agency directory and manually request matches with any agency. You can also update your profile and regenerate matches at any time.",
    },
    {
      question: "Is there a cost to use the platform?",
      answer:
        "The matching service is free. You only pay the agencies you choose to work with. No upfront fees, no commitments—just smart matching.",
    },
    {
      question: "How do I know an agency is right for my business?",
      answer:
        "Each match comes with a detailed fit score breakdown showing how well the agency aligns with your platforms, budget, industry, and objectives. You can also view their case studies, client reviews, and schedule a free discovery call before committing.",
    },
    {
      question: "What happens after I get matched?",
      answer:
        "You'll receive 3 top agency recommendations. From there, you can review their profiles, schedule calls, and choose the best fit. Once you select an agency, you'll work directly with them while we handle payments through our secure escrow system.",
    },
    {
      question: "Can I switch agencies if it's not working out?",
      answer:
        "Absolutely. If an engagement isn't meeting expectations, you can pause the project, request a new match, or end the relationship. Our escrow system ensures you only pay for work that's been delivered and approved.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Posted-style gradient background - pink to blue at top */}
      <div className="absolute inset-x-0 top-0 h-[500px] z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-pink-300 to-cyan-400"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900"></div>
      </div>

      {/* Header - Clean Posted-style */}
      <header className="relative z-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="https://res.cloudinary.com/effichat/image/upload/v1764713504/mywc0fu8gvdtxlwf02dh.svg" 
                alt="AgencyMatch" 
                className="h-12 w-auto" 
              />
            </div>
            
            {/* For Business / For Agencies Toggle - Switch Style */}
            <div className="hidden sm:flex items-center bg-gray-900/20 backdrop-blur-md rounded-full p-1 shadow-inner">
              <button
                onClick={() => navigate("/")}
                className="px-5 py-2.5 text-sm font-medium text-white bg-white/25 rounded-full transition-all duration-300 shadow-xl"
              >
                For Brands
              </button>
              <button
                onClick={() => navigate("/for-agencies")}
                className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white rounded-full transition-all duration-300"
              >
                For Agencies
              </button>
            </div>
            
            <button
              onClick={() => navigate("/login")}
              className="px-7 py-3 text-base font-medium text-gray-800 bg-white hover:bg-gray-100 rounded-full transition-colors duration-200 shadow-sm"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean Posted-style */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="text-center">
          {/* Headline - Single powerful line */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            Find your perfect agency match
          </h1>
          
          {/* Single CTA button */}
          <button
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-primary hover:bg-primary/90 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            Get Started Free
          </button>

          {/* Trust badge - Simple text */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Trusted by 100's of companies
          </p>
        </div>
      </section>

      {/* Logo Carousel - Full width, larger icons */}
      <div className="relative w-full overflow-hidden py-6">
        <div className="flex animate-scroll">
          {[...Array(2)].map((_, setIndex) => (
            <div
              key={setIndex}
              className="flex gap-6 items-center flex-shrink-0 px-3"
            >
              {[
                { icon: "😺", bg: "bg-gradient-to-br from-cyan-300 to-cyan-500" },
                { icon: "📍", bg: "bg-gradient-to-br from-pink-400 to-rose-500" },
                { icon: "💲", bg: "bg-gradient-to-br from-blue-500 to-blue-600" },
                { icon: "🚀", bg: "bg-gradient-to-br from-blue-400 to-indigo-500" },
                { icon: "📐", bg: "bg-gradient-to-br from-indigo-300 to-indigo-500" },
                { icon: "💎", bg: "bg-gradient-to-br from-pink-300 to-pink-400" },
                { icon: "📊", bg: "bg-gradient-to-br from-slate-700 to-slate-900" },
                { icon: "🍓", bg: "bg-gradient-to-br from-red-400 to-red-500" },
                { icon: "🎯", bg: "bg-gradient-to-br from-orange-400 to-red-500" },
                { icon: "⚡", bg: "bg-gradient-to-br from-yellow-400 to-amber-500" },
                { icon: "🔮", bg: "bg-gradient-to-br from-violet-400 to-purple-600" },
                { icon: "🌿", bg: "bg-gradient-to-br from-emerald-400 to-green-500" },
              ].map((item, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className={`w-16 h-16 md:w-20 md:h-20 ${item.bg} rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-200 cursor-pointer`}
                >
                  <span className="text-3xl md:text-4xl">{item.icon}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <section className="relative py-12 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              BENEFITS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Why Choose AgencyMatch
            </h2>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 text-center animate-fade-in" style={{ animationDelay: '0ms' }}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Only pay for results ✅
              </h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 text-center animate-fade-in" style={{ animationDelay: '150ms' }}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Skip the research 🕘
              </h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Find the right fit 🎯
              </h3>
            </div>
          </div>

          {/* Video Demo Section 
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
              {/* Video Placeholder
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-600/10 to-blue-600/20"></div>
              
               Play Button
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                  <Icon name="play_arrow" className="text-white text-5xl ml-1" />
                </div>
              </div>
              
              Logo Watermark
              <div className="absolute bottom-4 left-4">
                <img src="https://res.cloudinary.com/effichat/image/upload/v1764713504/mywc0fu8gvdtxlwf02dh.svg" alt="AgencyMatch" className="h-8" />
              </div>
              
              Video element placeholder - replace src with actual video
              <video className="w-full h-full object-cover" poster="/assets/video-poster.jpg">
                <source src="/assets/demo-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>*/}
        </div>
      </section>

      {/* How It Works - Step 1 - Clean Posted-style */}
      <section className="relative py-12 md:py-14 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Get Matched in 60 seconds
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Complete Quick Onboarding
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Answer 5 strategic questions.
              </p>
              <button
                onClick={() => navigate("/onboarding")}
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-full transition-colors duration-200"
              >
                Get Started Free
              </button>
            </div>
            <div className="bg-primary rounded-2xl p-8 shadow-xl">
              <div className="space-y-6">
                {[
                  { num: 1, text: "Current Ad Operations" },
                  { num: 2, text: "Monthly Ad Spend" },
                  { num: 3, text: "Performance & Objectives" },
                  { num: 4, text: "Industry & Growth Intent" },
                  { num: 5, text: "Review & Get Matched" },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center text-base font-bold shadow-md group-hover:scale-105 transition-all duration-300">
                        {step.num}
                      </div>
                      {/* Connecting line to next step */}
                      {index < 4 && (
                        <div className="absolute left-1/2 top-full w-0.5 h-6 -translate-x-1/2 bg-white/50"></div>
                      )}
                    </div>
                    <span className="text-white font-medium text-base">
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step 2 */}
      <section className="relative py-12 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="bg-primary rounded-2xl p-8 shadow-xl order-2 md:order-1">
              <div className="space-y-6">
                {[
                  { num: 1, text: "View your top 3 matches" },
                  { num: 2, text: "Browse all agencies" },
                  { num: 3, text: "Schedule calls directly" },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center text-base font-bold shadow-md group-hover:scale-105 transition-all duration-300">
                        {step.num}
                      </div>
                      {/* Connecting line to next step */}
                      {index < 2 && (
                        <div className="absolute left-1/2 top-full w-0.5 h-6 -translate-x-1/2 bg-white/50"></div>
                      )}
                    </div>
                    <span className="text-white font-medium text-base">
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 order-1 md:order-2">
              <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Review Your Matches
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get recommendations with match scores and capabilities.
              </p>
              <button
                onClick={() => navigate("/onboarding")}
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-full transition-colors duration-200"
              >
                Try for Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean Posted-style */}
      <section className="relative py-10 md:py-12 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: "10+", label: "Verified Agencies" },
              { value: "1,000+", label: "Successful Matches" },
              { value: "95%", label: "Match Satisfaction" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-12 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Transparent Pricing
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              No hidden fees. Only pay when you see results.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Free Matching
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Browse agencies and get recommendations at no cost.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    10% Commission
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Only on new revenue generated. You keep 90%.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Escrow Protection
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Payments held until work is confirmed complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-12 md:py-14 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Success Stories
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Found the perfect agency in 2 days 🎯 Our ROAS went from 1.8x to 4.2x in just 3 months. Wish I found this sooner!",
                name: "Sarah M.",
                role: "E-commerce",
                emoji: "🚀",
              },
              {
                quote:
                  "Finally an agency that gets B2B 🙌 180% more qualified leads and our CAC dropped by 35%. The matching actually works.",
                name: "James D.",
                role: "SaaS Founder",
                emoji: "💡",
              },
              {
                quote:
                  "Scaled from $15k to $85k/month ad spend with confidence 📈 The escrow system made it risk-free to try new agencies.",
                name: "Maria R.",
                role: "DTC Brand",
                emoji: "✨",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="text-3xl mb-3">{testimonial.emoji}</div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{testimonial.name}</span>
                  <span className="text-gray-500 dark:text-gray-400"> · {testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-12 md:py-14 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              FAQ
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm pr-4">
                    {faq.question}
                  </span>
                  <Icon
                    name={expandedFaq === index ? "expand_less" : "expand_more"}
                    className="text-gray-400 text-xl flex-shrink-0"
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed pt-3">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Clean Posted-style */}
      <section className="relative py-12 md:py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Launch your agency search today 🚀
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10+</div>
              <div className="text-white/80 text-sm">Agencies</div>
            </div>
            <button
              onClick={() => navigate("/onboarding")}
              className="px-8 py-3 text-base font-semibold text-primary bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors duration-200"
            >
              Try for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Clean Posted-style */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-3">
                <img 
                  src="https://res.cloudinary.com/effichat/image/upload/v1764713504/mywc0fu8gvdtxlwf02dh.svg" 
                  alt="AgencyMatch" 
                  className="h-8 w-auto" 
                />
              </div>
              <p className="text-gray-400 text-sm">
                Find your perfect agency match. Smart matching. Transparent pricing.
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3 text-sm">Contact Us</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <a href="mailto:info@effidigi.com" className="block hover:text-white transition-colors">
                  info@effidigi.com
                </a>
                <a href="tel:+37253400432" className="block hover:text-white transition-colors">
                  +372 5340 0432
                </a>
                <span className="block">HQ Tallinn, Estonia</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-center text-gray-500 text-xs">
              © 2025. All rights reserved by EFFI AI SOLUTIONS OÜ.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
