
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * For GitHub, expects: { owner, repo }
 * For GitLab, expects: { projectId }
 */
export const useRepositoryBranches = (params: { 
  provider: "github"; 
  owner: string; 
  repo: string; 
} | {
  provider: "gitlab";
  projectId: number;
}) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params) return;
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      setBranches([]);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Missing auth session");

        let response;
        if (params.provider === "github") {
          response = await supabase.functions.invoke('github-data', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { kind: 'branches', owner: params.owner, repo: params.repo }
          });
        } else {
          response = await supabase.functions.invoke('gitlab-data', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { kind: 'branches', project_id: params.projectId }
          });
        }

        let branchData = [];
        if (typeof response === "string") {
          branchData = JSON.parse(response);
        } else if (typeof (response as any)?.data === "string") {
          branchData = JSON.parse((response as any).data);
        } else if (Array.isArray(response)) {
          branchData = response as any[];
        } else if (Array.isArray((response as any)?.data)) {
          branchData = (response as any).data;
        }

        if (Array.isArray(branchData)) {
          if (params.provider === "github") {
            setBranches(branchData.map((b: any) => b.name || ""));
          } else {
            setBranches(branchData.map((b: any) => b.name || ""));
          }
        } else {
          setBranches([]);
        }
      } catch (error: any) {
        setError("Error loading branches");
        toast({ title: "Error", description: error.message || String(error), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [params]);

  return { branches, loading, error };
};
