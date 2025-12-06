import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";

export const ForAgencies: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Gradient background - vibrant indigo to purple */}
      <div className="absolute inset-x-0 top-0 h-[500px] z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900"></div>
      </div>

      {/* Header */}
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
                className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white rounded-full transition-all duration-300"
              >
                For Brands
              </button>
              <button
                onClick={() => navigate("/for-agencies")}
                className="px-5 py-2.5 text-sm font-medium text-white bg-white/25 rounded-full transition-all duration-300 shadow-md"
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

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Grow with qualified leads
          </h1>
          
          <button
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            Join as Agency
          </button>
        </div>
      </section>

      {/* Stats in hero */}
      <section className="relative z-10 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center gap-12">
            {[
              { value: "25+", label: "Active Businesses" },
              { value: "€300K+", label: "Monthly Ad Spend" },
              { value: "95%", label: "Match Rate" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-black">{stat.value}</div>
                <div className="text-black text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-12 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Why Partner With Us
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Pre-qualified leads
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Find businesses that match your expertise.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Grow predictably
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Build a consistent client pipeline effortlessly.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Build credibility
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get verified and showcase your capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-12 md:py-14 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create profile", desc: "Set up your specializations and case studies." },
              { step: "2", title: "Get matched", desc: "Our algorithm finds businesses seeking you." },
              { step: "3", title: "Close deals", desc: "Connect with pre-qualified leads." },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-12 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Simple Pricing
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Only pay when you close deals.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-indigo-600 rounded-2xl p-8 shadow-xl text-center">
              <div className="text-5xl font-bold text-white mb-2">10%</div>
              <div className="text-white/80 mb-6">
                Commission on closed deals
              </div>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "Free to join",
                  "Unlimited matches",
                  "Verified badge",
                  "Escrow protection",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <span className="text-white">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/onboarding")}
                className="w-full px-6 py-3 text-base font-semibold text-indigo-600 bg-white hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                Apply to Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-12 md:py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to grow? 🚀
          </h2>
          <button
            onClick={() => navigate("/onboarding")}
            className="px-8 py-3 text-base font-semibold text-indigo-600 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors duration-200"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 py-10">
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
                Connect with businesses seeking your expertise.
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3 text-sm">Contact Us</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <a href="mailto:info@effidigi.com" className="block hover:text-white transition-colors">
                  info@effidigi.com
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
