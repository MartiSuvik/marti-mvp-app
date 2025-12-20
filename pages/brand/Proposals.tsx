import React from "react";
import { Icon } from "../../components/Icon";
import { Card } from "../../components/ui/Card";

export const Proposals: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Proposals
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review proposals from your matched agencies
        </p>
      </div>

      {/* Empty State */}
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
          <Icon name="description" className="text-3xl text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No proposals yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          When agencies send you proposals, they'll appear here. Start by connecting with agencies from your matches.
        </p>
      </Card>
    </div>
  );
};
