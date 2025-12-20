import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Agency } from "../../types";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";

export const Agencies: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [spendFilter, setSpendFilter] = useState("");

  const platforms = [
    "Meta",
    "Google"
  ];
  const spendBrackets = [
    "Under $5k",
    "$5–20k",
    "$20–50k",
    "$50–150k",
    "$150k+",
  ];

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    filterAgencies();
  }, [searchTerm, platformFilter, industryFilter, spendFilter, agencies]);

  const loadAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("verified", true)
        .order("name");

      if (error) throw error;

      // If no agencies in DB, use mock data
      if (!data || data.length === 0) {
        const mockAgencies = generateMockAgencies();
        setAgencies(mockAgencies);
        setFilteredAgencies(mockAgencies);
      } else {
        // Map snake_case DB fields to camelCase TypeScript interface
        const mappedAgencies: Agency[] = data.map((a: any) => ({
          id: a.id,
          name: a.name,
          logoUrl: a.logo_url,
          description: a.description,
          platforms: a.platforms || [],
          industries: a.industries || [],
          spendBrackets: a.spend_brackets || [],
          objectives: a.objectives || [],
          verified: a.verified || false,
        }));
        setAgencies(mappedAgencies);
        setFilteredAgencies(mappedAgencies);
      }
    } catch (error) {
      console.error("Error loading agencies:", error);
      // Fallback to mock data
      const mockAgencies = generateMockAgencies();
      setAgencies(mockAgencies);
      setFilteredAgencies(mockAgencies);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAgencies = (): Agency[] => {
    return [
      {
        id: "1",
        name: "Elevate Digital",
        description:
          "Full-service digital marketing agency specializing in e-commerce and SaaS growth.",
        platforms: ["FB/IG", "Google", "TikTok"],
        industries: ["E-commerce", "SaaS"],
        spendBrackets: ["$5–20k", "$20–50k", "$50–150k"],
        objectives: ["Improve ROAS", "Scale spend", "Creative improvement"],
        verified: true,
      },
      {
        id: "2",
        name: "Neon Strategies",
        description:
          "B2B marketing powerhouse focused on scaling high-growth SaaS companies.",
        platforms: ["Google", "YouTube", "LinkedIn"],
        industries: ["SaaS", "Finance"],
        spendBrackets: ["$20–50k", "$50–150k", "$150k+"],
        objectives: ["Scale spend", "Expand channels"],
        verified: true,
      },
      {
        id: "3",
        name: "Pixel Perfect",
        description:
          "Creative-first agency with expertise in performance marketing and analytics.",
        platforms: ["FB/IG", "Google", "Programmatic"],
        industries: ["E-commerce", "Healthcare"],
        spendBrackets: ["Under $5k", "$5–20k", "$20–50k"],
        objectives: ["Fix tracking", "Improve ROAS"],
        verified: true,
      },
      {
        id: "4",
        name: "Growth Catalyst",
        description:
          "Data-driven agency helping brands scale through strategic paid media.",
        platforms: ["FB/IG", "Google", "TikTok", "LinkedIn"],
        industries: ["E-commerce", "Fitness"],
        spendBrackets: ["$5–20k", "$20–50k", "$50–150k"],
        objectives: ["Scale spend", "Improve ROAS", "Expand channels"],
        verified: true,
      },
    ];
  };

  const filterAgencies = () => {
    let filtered = [...agencies];

    if (searchTerm) {
      filtered = filtered.filter(
        (agency) =>
          agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (platformFilter) {
      filtered = filtered.filter((agency) =>
        agency.platforms?.includes(platformFilter)
      );
    }

    if (industryFilter) {
      filtered = filtered.filter((agency) =>
        agency.industries?.includes(industryFilter)
      );
    }

    if (spendFilter) {
      filtered = filtered.filter((agency) =>
        agency.spendBrackets?.includes(spendFilter)
      );
    }

    setFilteredAgencies(filtered);
  };

  const handleRequestMatch = async (agencyId: string, agencyName: string) => {
    if (!user) {
      showToast("Please sign in to request a match", "error");
      return;
    }

    // Confirm before submitting
    const confirmed = window.confirm(
      `Request a match with ${agencyName}? This will add them to your Deals page.`
    );

    if (!confirmed) return;

    // Create a deal for this agency
    try {
      const { data: dealData, error } = await supabase
        .from("deals")
        .insert({
          user_id: user.id,
          agency_id: agencyId,
          match_score: 0, // Manual request
          status: "new",
        })
        .select()
        .single();

      if (error) throw error;

      // Notify agency via Edge Function (fire and forget - don't block UI)
      try {
        const notifyResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-agency-match`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              dealId: dealData.id,
              agencyId: agencyId,
              businessUserId: user.id,
            }),
          }
        );
        
        if (!notifyResponse.ok) {
          console.warn("Agency notification may have failed:", await notifyResponse.text());
        }
      } catch (notifyError) {
        // Don't fail the whole operation if notification fails
        console.warn("Could not send agency notification:", notifyError);
      }

      // Create conversation for this deal (enables chat)
      try {
        await supabase.from("conversations").insert({
          deal_id: dealData.id,
          business_id: user.id,
          agency_id: agencyId,
        });
      } catch (convError) {
        // Don't fail if conversation creation fails
        console.warn("Could not create conversation:", convError);
      }

      showToast(`${agencyName} has been added to your Deals page! They've been notified.`, "success");
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Agencies
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse all verified agencies in our network
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="search"
          />
          <Select
            options={[
              { value: "", label: "All Platforms" },
              ...platforms.map((p) => ({ value: p, label: p })),
            ]}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          />
          <Select
            options={[
              { value: "", label: "All Budgets" },
              ...spendBrackets.map((s) => ({ value: s, label: s })),
            ]}
            value={spendFilter}
            onChange={(e) => setSpendFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgencies.map((agency) => (
          <Card key={agency.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AgencyLogo
                  logoUrl={agency.logoUrl}
                  name={agency.name}
                  size="md"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {agency.name}
                  </h3>
                  {agency.verified && (
                    <span className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                      <Icon name="verified" className="text-sm mr-1" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {agency.description || "No description available"}
            </p>

            {agency.platforms && agency.platforms.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Expertise
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {agency.platforms.slice(0, 3).map((platform) => (
                    <span
                      key={platform}
                      className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"
                    >
                      {platform}
                    </span>
                  ))}
                  {agency.platforms.length > 3 && (
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500">
                      +{agency.platforms.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleRequestMatch(agency.id, agency.name)}
            >
              Request Match
            </Button>
          </Card>
        ))}
      </div>

      {filteredAgencies.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Icon
              name="search_off"
              className="text-6xl text-gray-300 dark:text-gray-600 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No agencies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
