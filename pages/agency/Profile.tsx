import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";

export const Profile: React.FC = () => {
  const { agency, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        description: agency.description || "",
        logoUrl: agency.logoUrl || "",
        contactEmail: agency.contactEmail || "",
      });
    }
  }, [agency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({
          name: formData.name,
          description: formData.description,
          logo_url: formData.logoUrl,
          contact_email: formData.contactEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency.id);

      if (error) throw error;

      await refreshProfile();
      showToast("Agency profile updated successfully", "success");
    } catch (error) {
      console.error("Error updating agency:", error);
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!agency) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading agency profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Agency
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your agency profile and settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Agency Info Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="business" className="text-3xl text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {agency.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {agency.verified ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Icon name="verified" className="text-base" />
                    Verified Agency
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Pending verification</span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agency Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your agency name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="contact@agency.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo URL
              </label>
              <Input
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Tell brands about your agency..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Capabilities Card (Read-only for now) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Capabilities & Expertise
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {agency.platforms?.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Industries
              </p>
              <div className="flex flex-wrap gap-2">
                {agency.industries?.map((industry) => (
                  <span
                    key={industry}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-2">
                {agency.capabilities?.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Contact support to update your capabilities and expertise.
          </p>
        </Card>
      </div>
    </div>
  );
};
