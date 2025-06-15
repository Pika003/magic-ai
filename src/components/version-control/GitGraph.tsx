
import React, { useEffect, useState } from "react";
import { fetchCommitHistory } from "@/services/versionControlService";

type Commit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
};

interface GitGraphProps {
  provider: 'github' | 'gitlab';
  owner?: string;
  repo?: string;
  projectId?: number;
  branch: string;
  onClose?: () => void;
}

export const GitGraph: React.FC<GitGraphProps> = ({
  provider,
  owner,
  repo,
  projectId,
  branch,
}) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCommitHistory({
      provider,
      owner,
      repo,
      projectId,
      branch,
    })
      .then(data => setCommits(data))
      .finally(() => setLoading(false));
  }, [provider, owner, repo, projectId, branch]);

  if (loading) {
    return <div className="py-6 text-center text-muted-foreground">Loading git graph...</div>;
  }
  if (commits.length === 0) {
    return <div className="py-6 text-center text-muted-foreground">No commit history found.</div>;
  }

  // Simple linear history: dot per commit, with lines; for merge commit (parents.length > 1), fill red
  const radius = 10;
  const gap = 45;
  const width = 400;
  const height = commits.length * gap + 40;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height}>
        {commits.map((c, i) => (
          <g key={c.sha}>
            {/* Draw line to previous commit */}
            {i < commits.length - 1 && (
              <line
                x1={width / 2}
                y1={gap / 2 + gap * i}
                x2={width / 2}
                y2={gap / 2 + gap * (i + 1)}
                stroke="#888"
                strokeWidth="3"
              />
            )}
            {/* Dot for each commit */}
            <circle
              cx={width / 2}
              cy={gap / 2 + gap * i}
              r={radius}
              fill={c.parents.length > 1 ? "#fd6363" : "#1164ff"}
              stroke="#fff"
              strokeWidth="2"
            />
            {/* Commit SHA and message */}
            <text
              x={width / 2 + 30}
              y={gap / 2 + gap * i + 4}
              fontSize="12"
              fill="#444"
            >
              {c.message.slice(0, 48)}{c.message.length > 48 ? "..." : ""}
            </text>
            <text
              x={width / 2 + 30}
              y={gap / 2 + gap * i + 18}
              fontSize="11"
              fill="#888"
            >
              {c.author} — {c.date ? new Date(c.date).toLocaleDateString() : ""}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
