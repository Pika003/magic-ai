import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── POST /api/git-actions ────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { provider, kind, repoId, projectId, branchName, sourceBranch, targetBranch, commitSha } = req.body;

  const isGitHub = provider === 'github' || !!repoId;
  const id = repoId || projectId;

  try {
    let token = '';
    if (isGitHub) {
      const tokenResult = await pool.query(
        'SELECT access_token FROM public.user_github_tokens WHERE user_id = $1 AND connected = true',
        [req.userId]
      );
      if (!tokenResult.rows[0]) {
        res.status(401).json({ error: 'GitHub account not connected' });
        return;
      }
      token = tokenResult.rows[0].access_token;
    } else {
      const tokenResult = await pool.query(
        'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
        [req.userId]
      );
      if (!tokenResult.rows[0]) {
        res.status(401).json({ error: 'GitLab account not connected' });
        return;
      }
      token = tokenResult.rows[0].access_token;
    }

    const githubApi = async (endpoint: string, method = 'GET', body?: any): Promise<any> => {
      const resp = await fetch(`https://api.github.com${endpoint}`, {
        method,
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return resp.json();
    };

    const gitlabApi = async (endpoint: string, method = 'GET', body?: any): Promise<any> => {
      const resp = await fetch(`https://gitlab.com/api/v4${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return resp.json();
    };

    switch (kind) {
      case 'create-branch': {
        if (isGitHub) {
          const repo: any = await githubApi(`/repositories/${id}`);
          const defaultBranch = repo.default_branch || 'main';
          const refData: any = await githubApi(`/repositories/${id}/git/ref/heads/${defaultBranch}`);
          const sha = refData?.object?.sha;
          if (!sha) throw new Error('Could not retrieve branch SHA');

          const result = await githubApi(`/repositories/${id}/git/refs`, 'POST', {
            ref: `refs/heads/${branchName}`,
            sha,
          });
          res.json(result);
        } else {
          const result = await gitlabApi(
            `/projects/${id}/repository/branches?branch=${encodeURIComponent(branchName)}&ref=main`,
            'POST'
          );
          res.json(result);
        }
        break;
      }

      case 'merge-branch': {
        if (isGitHub) {
          const result = await githubApi(`/repositories/${id}/merges`, 'POST', {
            base: targetBranch,
            head: sourceBranch,
          });
          res.json(result);
        } else {
          const result = await gitlabApi(`/projects/${id}/merge_requests`, 'POST', {
            source_branch: sourceBranch,
            target_branch: targetBranch,
            title: `Merge ${sourceBranch} into ${targetBranch}`,
          });
          res.json(result);
        }
        break;
      }

      case 'revert-commit': {
        if (isGitHub) {
          res.status(400).json({ error: 'Direct commit revert not supported by GitHub REST API' });
        } else {
          const result = await gitlabApi(`/projects/${id}/repository/commits/${commitSha}/revert`, 'POST');
          res.json(result);
        }
        break;
      }

      case 'view-commits': {
        if (isGitHub) {
          const result = await githubApi(`/repositories/${id}/commits?per_page=30`);
          res.json(result);
        } else {
          const result = await gitlabApi(`/projects/${id}/repository/commits?per_page=30`);
          res.json(result);
        }
        break;
      }

      default:
        res.status(400).json({ error: `Unknown action: ${kind}` });
    }
  } catch (err: any) {
    console.error('[GIT_ACTIONS] error:', err);
    res.status(500).json({ error: err.message || 'Git action failed' });
  }
});

export default router;
