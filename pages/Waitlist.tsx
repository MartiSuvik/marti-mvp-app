import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";

export const Waitlist: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 py-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-blue-500/10 animate-gradient"></div>
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Success Animation */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-float">
            <Icon name="check_circle" className="text-white text-3xl" />
          </div>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl shadow-2xl p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            You're on the List! 🎉
          </h1>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Thank you for joining the ScalingAD waitlist. We'll match you with the perfect agencies once we launch.
          </p>

          {/* What happens next */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
              <Icon name="info" className="text-primary text-base" />
              What happens next?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  We'll find the best agency matches for your profile
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  You'll receive an email when we officially launch
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Early members get priority matching & exclusive perks
                </p>
              </li>
            </ul>
          </div>

          {/* Expected Launch */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-3 mb-4 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
              <Icon name="rocket_launch" className="text-base" />
              <span>Expected Launch: Q4 2025</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="w-full"
          >
            <Icon name="arrow_back" className="mr-2 text-base" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
