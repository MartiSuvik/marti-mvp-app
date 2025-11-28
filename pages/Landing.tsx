import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/Icon";

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
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
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-blue-500/10 animate-gradient"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/30 dark:border-gray-800/30">
        {/* Gradient background overlay - similar to postedapp.com */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/75 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-gray-900/75 backdrop-blur-xl"></div>
        {/* More visible gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-purple-500/12 to-blue-500/15 dark:from-primary/20 dark:via-purple-500/18 dark:to-blue-500/20"></div>
        {/* Animated gradient overlay for movement */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-purple-500/8 dark:from-primary/12 dark:via-transparent dark:to-purple-500/12 animate-gradient"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                <Icon name="trending_up" className="text-white text-2xl" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AgencyMatch
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium px-5"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          ></div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `linear-gradient(rgba(239, 46, 110, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 46, 110, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>

          {/* Radial gradient from center */}
          <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent"></div>
        </div>

        <div className="text-center animate-fade-in relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-in">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trusted by 500+ companies
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            Find your perfect
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
                agency match
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-primary/20 via-pink-500/20 to-purple-600/20 blur-xl"></span>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Get matched with top-performing marketing agencies based on your
            needs. No lengthy forms. Just smart matching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 font-semibold"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-gray-300 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 font-semibold"
            >
              Book a Demo
            </Button>
          </div>

          {/* Logo Carousel */}
          <div className="relative w-full overflow-hidden mt-12 py-4">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-gray-900 dark:via-transparent dark:to-gray-900 z-10 pointer-events-none"></div>
            <div className="flex animate-scroll">
              {/* Duplicate set for seamless loop */}
              {[...Array(2)].map((_, setIndex) => (
                <div
                  key={setIndex}
                  className="flex gap-6 items-center flex-shrink-0 px-4"
                >
                  {[
                    { name: "TechCorp", color: "bg-blue-500" },
                    { name: "GrowthCo", color: "bg-purple-500" },
                    { name: "ScaleUp", color: "bg-green-500" },
                    { name: "DigitalPro", color: "bg-orange-500" },
                    { name: "MarketHub", color: "bg-pink-500" },
                    { name: "BrandLab", color: "bg-indigo-500" },
                    { name: "AdVenture", color: "bg-teal-500" },
                    { name: "MediaFlow", color: "bg-red-500" },
                    { name: "CloudSync", color: "bg-cyan-500" },
                    { name: "DataVault", color: "bg-amber-500" },
                  ].map((company, index) => (
                    <div
                      key={`${setIndex}-${index}`}
                      className="flex items-center justify-center w-36 h-20 glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
                    >
                      <div
                        className={`w-12 h-12 ${company.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-white text-sm font-bold">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {company.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient mesh */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/8 via-purple-500/6 to-blue-500/8 dark:from-primary/12 dark:via-purple-500/10 dark:to-blue-500/12"></div>

          {/* Animated shapes */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(239, 46, 110, 0.3) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Why Choose AgencyMatch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built for modern businesses that value efficiency and results
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group glass rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary/20">
                  <Icon name="speed" className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                  Only pay for top performing agencies
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Stop wasting time on agencies that don't fit. Get matched with
                  agencies that align with your goals, budget, and platform
                  needs.
                </p>
              </div>
            </div>

            <div className="group glass rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                  <Icon name="psychology" className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 transition-colors">
                  Skip the agency research hassle
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  No more hours spent researching, vetting, and comparing
                  agencies. Our matching engine does the work for you.
                </p>
              </div>
            </div>

            <div className="group glass rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
                  <Icon name="verified" className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                  Find agency-market fit
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Validate agency matches with real expertise alignment. See
                  match scores and capabilities before you commit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step 1 */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent dark:via-purple-500/8"></div>

          {/* Floating shapes */}
          <div className="absolute top-1/3 left-0 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/3 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/12 to-cyan-500/12 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2.5s" }}
          ></div>

          {/* Wave pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Get Matched in Minutes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              Our lightweight onboarding gets you matched with the perfect
              agencies—no lengthy forms, no sensitive data required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Complete Quick Onboarding
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Answer 5 strategic questions about your ad operations, budget,
                objectives, and industry. Takes just 5 minutes.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Button>
            </div>
            <div className="glass rounded-3xl p-8 md:p-10 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <div className="space-y-5">
                {[
                  { num: 1, text: "Current Ad Operations" },
                  { num: 2, text: "Monthly Ad Spend" },
                  { num: 3, text: "Performance & Objectives" },
                  { num: 4, text: "Industry & Growth Intent" },
                  { num: 5, text: "Review & Get Matched" },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {step.num}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary transition-colors">
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
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent dark:via-blue-500/8"></div>

          {/* Animated orbs */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-br from-primary/12 to-pink-500/12 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.8s" }}
          ></div>

          {/* Geometric pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="glass rounded-3xl p-8 md:p-10 border border-gray-200/50 dark:border-gray-700/50 shadow-xl order-2 md:order-1">
              <div className="space-y-6">
                {[
                  {
                    icon: "check_circle",
                    title: "View Your Matches",
                    desc: "See 3 top agency recommendations with match scores and capabilities",
                  },
                  {
                    icon: "check_circle",
                    title: "Browse All Agencies",
                    desc: "Explore the full directory and manually request matches",
                  },
                  {
                    icon: "check_circle",
                    title: "Schedule Calls",
                    desc: "Book clarity calls directly with agencies you're interested in",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <Icon name={item.icon} className="text-white text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Review Your Matches
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Get 3 agency recommendations with match scores, capabilities,
                and fit analysis. Browse all agencies or request specific
                matches.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Multi-color gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-purple-500/6 to-blue-500/8 dark:from-primary/12 dark:via-purple-500/10 dark:to-blue-500/12"></div>

          {/* Large animated orbs */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute top-1/2 right-0 translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Sparkle effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(239, 46, 110, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: "500+", label: "Verified Agencies" },
              { value: "1,000+", label: "Successful Matches" },
              { value: "95%", label: "Match Satisfaction" },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-primary via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Clarity Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/6 to-transparent dark:via-primary/10"></div>

          {/* Floating gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/18 to-pink-500/18 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/18 to-purple-500/18 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2.2s" }}
          ></div>

          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `linear-gradient(30deg, rgba(239, 46, 110, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(239, 46, 110, 0.1) 87.5%, rgba(239, 46, 110, 0.1)), linear-gradient(150deg, rgba(239, 46, 110, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(239, 46, 110, 0.1) 87.5%, rgba(239, 46, 110, 0.1)), linear-gradient(30deg, rgba(239, 46, 110, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(239, 46, 110, 0.1) 87.5%, rgba(239, 46, 110, 0.1)), linear-gradient(150deg, rgba(239, 46, 110, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(239, 46, 110, 0.1) 87.5%, rgba(239, 46, 110, 0.1))`,
              backgroundSize: "80px 140px",
              backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px",
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              No hidden fees. No upfront costs. Only pay when you see results.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-8">
                {[
                  {
                    icon: "check_circle",
                    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
                    title: "Free Matching Service",
                    desc: "Our matching platform is completely free. Browse agencies, get recommendations, and schedule calls at no cost.",
                  },
                  {
                    icon: "percent",
                    iconBg: "bg-gradient-to-br from-primary to-pink-600",
                    title: "10% Commission on New Revenue",
                    desc: "We only take 10% of the newly generated revenue after the agency has started producing ADS. You keep 90% of all revenue.",
                    subDesc:
                      "The agency and business owner work together as we hold funds in escrow until both parties have fulfilled their part.",
                  },
                  {
                    icon: "security",
                    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
                    title: "Escrow Protection",
                    desc: "All payments are held in escrow until both parties confirm work completion. Your funds are protected.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-5 group">
                    <div
                      className={`w-14 h-14 ${item.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    >
                      <Icon name={item.icon} className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.desc}
                      </p>
                      {item.subDesc && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {item.subDesc}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent dark:via-purple-500/8"></div>

          {/* Animated shapes */}
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-br from-pink-500/12 to-primary/12 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>

          {/* Mesh gradient */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.2) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%)`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              Real results from businesses that found their perfect agency match
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote:
                  "AgencyMatch connected us with the perfect agency. Within 3 months, our ROAS increased by 240% and we scaled from $15k to $85k monthly ad spend.",
                name: "Sarah Mitchell",
                role: "CEO, TechFlow Inc.",
                metric: "+240% ROAS | $85k/month",
                initials: "SM",
                gradient: "from-primary/20 to-pink-500/20",
                textColor: "text-primary",
              },
              {
                quote:
                  "The matching algorithm found us an agency that understood our B2B SaaS model. We've seen a 180% increase in qualified leads and reduced CAC by 35%.",
                name: "James Davis",
                role: "CMO, CloudSync Solutions",
                metric: "+180% Leads | -35% CAC",
                initials: "JD",
                gradient: "from-blue-500/20 to-blue-600/20",
                textColor: "text-blue-600 dark:text-blue-400",
              },
              {
                quote:
                  "From inconsistent performance to scaling well. Our matched agency helped us expand to TikTok and LinkedIn, resulting in 320% revenue growth in 6 months.",
                name: "Maria Rodriguez",
                role: "Founder, FitLife Brands",
                metric: "+320% Revenue | 6 months",
                initials: "MR",
                gradient: "from-green-500/20 to-green-600/20",
                textColor: "text-green-600 dark:text-green-400",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="group glass rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${testimonial.gradient} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}
                ></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        name="star"
                        className="text-yellow-400 text-xl"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed italic text-base">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <span
                        className={`${testimonial.textColor} font-bold text-lg`}
                      >
                        {testimonial.initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </div>
                      <div className="text-sm font-semibold text-primary mt-1">
                        {testimonial.metric}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/4 to-transparent dark:via-blue-500/6"></div>

          {/* Floating orbs */}
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-gradient-to-br from-blue-500/12 to-cyan-500/12 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2.8s" }}
          ></div>

          {/* Hexagon pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Why It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart matching at scale",
                desc: "Our algorithm analyzes multiple signals—platform expertise, budget compatibility, industry specialization, and objective alignment—to find your perfect match.",
              },
              {
                title: "Verified agency network",
                desc: "All agencies are vetted for quality, performance, and expertise. We verify capabilities, past work, and client results before adding them to the platform.",
              },
              {
                title: "No commitment required",
                desc: "Browse matches, schedule calls, and explore agencies—all for free. You only pay the agencies you choose to work with.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="glass rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Stylish Background Components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent dark:via-primary/8"></div>

          {/* Subtle animated orbs */}
          <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-br from-primary/12 to-pink-500/12 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute top-1/2 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/12 to-blue-500/12 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Subtle dots pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(239, 46, 110, 0.2) 1.5px, transparent 1.5px)`,
              backgroundSize: "25px 25px",
            }}
          ></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              We've got you covered
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors pr-4">
                    {faq.question}
                  </span>
                  <Icon
                    name={expandedFaq === index ? "expand_less" : "expand_more"}
                    className="text-gray-400 text-2xl flex-shrink-0 group-hover:text-primary transition-all duration-300"
                    style={{
                      transform:
                        expandedFaq === index
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 animate-fade-in">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-pink-600 to-purple-600 animate-gradient"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Launch your agency search today 🚀
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light">
            Join hundreds of companies finding their perfect agency match
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-4 w-full sm:w-auto text-primary hover:bg-gray-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-4 w-full sm:w-auto bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-900 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                  <Icon name="trending_up" className="text-white text-2xl" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  AgencyMatch
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Find your perfect agency match. Smart matching. Transparent
                pricing.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contact Us</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Icon name="email" className="text-base" />
                  <a
                    href="mailto:info@effidigi.com"
                    className="hover:text-white transition-colors"
                  >
                    info@effidigi.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="phone" className="text-base" />
                  <a
                    href="tel:+37253400432"
                    className="hover:text-white transition-colors"
                  >
                    +372 5340 0432
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="location_on" className="text-base" />
                  <span>HQ Tallinn, Estonia</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <a
                  href="#how-it-works"
                  className="block hover:text-white transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  className="block hover:text-white transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#testimonials"
                  className="block hover:text-white transition-colors"
                >
                  Success Stories
                </a>
                <button
                  onClick={() => navigate("/login")}
                  className="block hover:text-white transition-colors text-left"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="text-center text-gray-400 text-sm">
              <p>© 2025. All rights reserved by AgencyMatch.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
