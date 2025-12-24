import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Agency } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";

export const AgencyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAgency();
    }
  }, [id]);

  const loadAgency = async () => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setAgency({
          id: data.id,
          name: data.name,
          logoUrl: data.logo_url,
          description: data.description,
          platforms: data.platforms || [],
          industries: data.industries || [],
          spendBrackets: data.spend_brackets || [],
          objectives: data.objectives || [],
          verified: data.verified || false,
        });
      }
    } catch (error) {
      console.error("Error loading agency:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMatch = async () => {
    if (!user) {
      showToast("Please sign in to request a match", "error");
      return;
    }

    if (!id) return;

    // Check if deal already exists
    const { data: existingDeal } = await supabase
      .from("deals")
      .select("id")
      .eq("user_id", user.id)
      .eq("agency_id", id)
      .maybeSingle();

    if (existingDeal) {
      showToast(`${agency?.name} is already in your matches!`, "error");
      navigate("/deals");
      return;
    }

    const confirmed = window.confirm(
      `Request a match with ${agency?.name}? This will add them to your Matches page.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("deals").insert({
        user_id: user.id,
        agency_id: id,
        match_score: 0,
        status: "new",
      });

      if (error) throw error;

      showToast(
        `${agency?.name} has been added to your Matches!`,
        "success"
      );
      navigate("/deals");
    } catch (error) {
      console.error("Error requesting match:", error);
      showToast("Error requesting match. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Icon
            name="hourglass_empty"
            className="text-4xl text-gray-400 animate-spin"
          />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <Icon
              name="error"
              className="text-6xl text-gray-300 dark:text-gray-600 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Agency not found
            </h3>
            <Button variant="primary" onClick={() => navigate("/agencies")}>
              Browse All Agencies
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <Icon name="arrow_back" className="mr-2" />
        Back
      </Button>

      <Card>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <AgencyLogo
              logoUrl={agency.logoUrl}
              name={agency.name}
              size="xl"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {agency.name}
                </h1>
                {agency.verified && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Icon name="verified" className="text-lg mr-1" />
                    <span className="text-sm font-medium">Verified Agency</span>
                  </div>
                )}
              </div>
            </div>

            {agency.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {agency.description}
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {agency.platforms && agency.platforms.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Platform Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agency.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {agency.industries && agency.industries.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Industries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agency.industries.map((industry) => (
                      <span
                        key={industry}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {agency.spendBrackets && agency.spendBrackets.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Budget Ranges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agency.spendBrackets.map((bracket) => (
                      <span
                        key={bracket}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                      >
                        {bracket}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleRequestMatch}
              className="w-full md:w-auto"
            >
              Hire
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
