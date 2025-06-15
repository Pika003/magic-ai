
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useLatestCommit = (params: { 
  provider: "github", owner: string, repo: string, branch?: string 
} | { 
  provider: "gitlab", projectId: number, branch?: string 
}) => {
  const [commit, setCommit] = useState<{ message: string, author: string, date: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params) return;
    const fetchCommit = async () => {
      setLoading(true);
      setError(null);
      setCommit(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Missing auth session");
        let response;

        if (params.provider === "github") {
          response = await supabase.functions.invoke('github-data', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { kind: 'commits', owner: params.owner, repo: params.repo, branch: params.branch }
          });
        } else {
          response = await supabase.functions.invoke('gitlab-data', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { kind: 'commits', project_id: params.projectId, branch: params.branch }
          });
        }

        let commitData = [];
        if (typeof response === "string") {
          commitData = JSON.parse(response);
        } else if (typeof (response as any)?.data === "string") {
          commitData = JSON.parse((response as any).data);
        } else if (Array.isArray(response)) {
          commitData = response as any[];
        } else if (Array.isArray((response as any)?.data)) {
          commitData = (response as any).data;
        }

        // Take first commit as latest
        if (Array.isArray(commitData) && commitData.length) {
          if (params.provider === "github") {
            setCommit({
              message: commitData[0].commit?.message || "",
              author: commitData[0].commit?.author?.name || "",
              date: commitData[0].commit?.author?.date || ""
            });
          } else {
            setCommit({
              message: commitData[0].title || commitData[0].message || "",
              author: commitData[0].author_name || commitData[0].author?.name || "",
              date: commitData[0].created_at || commitData[0].committed_date || ""
            });
          }
        }
      } catch (error: any) {
        setError("Error loading latest commit");
      } finally {
        setLoading(false);
      }
    };
    fetchCommit();
    // Only re-run if repo/branch/project changes
  }, [JSON.stringify(params)]);

  return { commit, loading, error };
};
