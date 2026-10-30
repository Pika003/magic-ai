import { api } from "@/lib/apiClient";

export async function createBranch({
  provider,
  repo,
  branchName,
}: {
  provider: string;
  repo: any;
  branchName: string;
}) {
  const body =
    provider === "github"
      ? { provider, kind: "create-branch", repoId: repo.id, branchName }
      : { provider, kind: "create-branch", projectId: repo.id, branchName };

  return await api.post("/git-actions", body);
}

export async function viewCommits({
  provider,
  repo,
}: {
  provider: string;
  repo: any;
}) {
  const body =
    provider === "github"
      ? { provider, kind: "view-commits", repoId: repo.id }
      : { provider, kind: "view-commits", projectId: repo.id };

  return await api.post<any[]>("/git-actions", body);
}

export async function mergeBranch({
  provider,
  repo,
  sourceBranch,
  targetBranch,
}: {
  provider: string;
  repo: any;
  sourceBranch: string;
  targetBranch: string;
}) {
  const body =
    provider === "github"
      ? {
          provider,
          kind: "merge-branch",
          repoId: repo.id,
          sourceBranch,
          targetBranch,
        }
      : {
          provider,
          kind: "merge-branch",
          projectId: repo.id,
          sourceBranch,
          targetBranch,
        };

  return await api.post("/git-actions", body);
}

export async function rollbackToCommit({
  provider,
  repo,
  commitSha,
}: {
  provider: string;
  repo: any;
  commitSha: string;
}) {
  const body =
    provider === "github"
      ? { provider, kind: "rollback-to-commit", repoId: repo.id, commitSha }
      : { provider, kind: "rollback-to-commit", projectId: repo.id, commitSha };

  return await api.post("/git-actions", body);
}

export async function revertCommit({
  provider,
  repo,
  commitSha,
}: {
  provider: string;
  repo: any;
  commitSha: string;
}) {
  const body =
    provider === "github"
      ? { provider, kind: "revert-commit", repoId: repo.id, commitSha }
      : { provider, kind: "revert-commit", projectId: repo.id, commitSha };

  return await api.post("/git-actions", body);
}
