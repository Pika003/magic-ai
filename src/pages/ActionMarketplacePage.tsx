import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  Search,
  Star,
  GitBranch,
  Github,
  Gitlab,
  Copy,
  CheckCheck,
  GitCommitHorizontal,
  Loader2,
  X,
  ChevronRight,
  Zap,
  Shield,
  Package,
  TestTube,
  Cloud,
  Code2,
  Container,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  stars: number;
  author: string;
  yaml: string;
  filename: string; // e.g. .github/workflows/ci.yml
  tags: string[];
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "CI/CD": Zap,
  "Security": Shield,
  "Deploy": Cloud,
  "Test": TestTube,
  "Build": Package,
  "Code Quality": Code2,
  "Docker": Container,
  "Release": GitBranch,
};

const categoryIcon = (cat: string) => {
  const Icon = CATEGORY_ICONS[cat] || Zap;
  return <Icon className="w-3.5 h-3.5" />;
};

// ─── GitHub Actions catalog ───────────────────────────────────────────────────
const GITHUB_ACTIONS: MarketplaceItem[] = [
  {
    id: "gh-node-ci",
    name: "Node.js CI",
    description: "Run tests and linting on every push and pull request for Node.js projects.",
    category: "CI/CD",
    stars: 4820,
    author: "actions",
    tags: ["node", "npm", "test"],
    filename: ".github/workflows/node-ci.yml",
    yaml: `name: Node.js CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run lint
        run: npm run lint --if-present
`,
  },
  {
    id: "gh-docker-build-push",
    name: "Docker Build & Push",
    description: "Build a Docker image and push it to Docker Hub or GitHub Container Registry on every release.",
    category: "Docker",
    stars: 3910,
    author: "docker",
    tags: ["docker", "container", "registry"],
    filename: ".github/workflows/docker-publish.yml",
    yaml: `name: Docker Build & Push

on:
  push:
    branches: [ "main" ]
    tags: [ 'v*.*.*' ]
  pull_request:
    branches: [ "main" ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`,
  },
  {
    id: "gh-codeql",
    name: "CodeQL Security Analysis",
    description: "Automatically scan your code for security vulnerabilities using GitHub's CodeQL engine.",
    category: "Security",
    stars: 5240,
    author: "github",
    tags: ["security", "codeql", "sast"],
    filename: ".github/workflows/codeql.yml",
    yaml: `name: CodeQL Security Analysis

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  schedule:
    - cron: '30 1 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'typescript' ]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: \${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:\${{ matrix.language }}"
`,
  },
  {
    id: "gh-deploy-vercel",
    name: "Deploy to Vercel",
    description: "Automatically deploy your frontend app to Vercel on every push to main.",
    category: "Deploy",
    stars: 2980,
    author: "vercel",
    tags: ["vercel", "deploy", "frontend"],
    filename: ".github/workflows/deploy-vercel.yml",
    yaml: `name: Deploy to Vercel

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel environment info
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Build project artifacts
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
`,
  },
  {
    id: "gh-release-drafter",
    name: "Release Drafter",
    description: "Auto-draft release notes based on merged pull requests using labels.",
    category: "Release",
    stars: 3650,
    author: "release-drafter",
    tags: ["release", "changelog", "automation"],
    filename: ".github/workflows/release-drafter.yml",
    yaml: `name: Release Drafter

on:
  push:
    branches: [ "main" ]
  pull_request:
    types: [opened, reopened, synchronize]

permissions:
  contents: read

jobs:
  update_release_draft:
    permissions:
      contents: write
      pull-requests: write

    runs-on: ubuntu-latest

    steps:
      - uses: release-drafter/release-drafter@v6
        with:
          config-name: release-drafter.yml
          disable-autolabeler: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
  },
  {
    id: "gh-eslint",
    name: "ESLint Code Quality",
    description: "Run ESLint on every push and PR to enforce code style and catch errors early.",
    category: "Code Quality",
    stars: 2100,
    author: "actions",
    tags: ["eslint", "lint", "javascript"],
    filename: ".github/workflows/eslint.yml",
    yaml: `name: ESLint Code Quality

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  eslint:
    name: Run ESLint
    runs-on: ubuntu-latest

    permissions:
      contents: read
      security-events: write
      actions: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npx eslint . --ext .js,.jsx,.ts,.tsx --format @microsoft/eslint-formatter-sarif --output-file eslint-results.sarif
        continue-on-error: true

      - name: Upload ESLint results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: eslint-results.sarif
          wait-for-processing: true
`,
  },
  {
    id: "gh-aws-deploy",
    name: "Deploy to AWS ECS",
    description: "Build and deploy a containerized app to Amazon ECS using GitHub Actions.",
    category: "Deploy",
    stars: 1870,
    author: "aws-actions",
    tags: ["aws", "ecs", "docker", "cloud"],
    filename: ".github/workflows/aws-ecs.yml",
    yaml: `name: Deploy to AWS ECS

on:
  push:
    branches: [ "main" ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: my-app
  ECS_SERVICE: my-app-service
  ECS_CLUSTER: my-cluster
  CONTAINER_NAME: my-app

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to ECR
        id: build-image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition.json
          service: \${{ env.ECS_SERVICE }}
          cluster: \${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
`,
  },
  {
    id: "gh-pytest",
    name: "Python Pytest CI",
    description: "Run Python tests with pytest across multiple Python versions on every push.",
    category: "Test",
    stars: 2560,
    author: "actions",
    tags: ["python", "pytest", "test"],
    filename: ".github/workflows/python-pytest.yml",
    yaml: `name: Python Pytest CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pytest pytest-cov
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run tests with pytest
        run: pytest --cov=./ --cov-report=xml

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
`,
  },
];

// ─── GitLab CI Templates catalog ─────────────────────────────────────────────
const GITLAB_TEMPLATES: MarketplaceItem[] = [
  {
    id: "gl-node-pipeline",
    name: "Node.js Pipeline",
    description: "Full CI pipeline for Node.js: install, lint, test and build stages.",
    category: "CI/CD",
    stars: 3210,
    author: "gitlab-org",
    tags: ["node", "npm", "pipeline"],
    filename: ".gitlab-ci.yml",
    yaml: `image: node:20-alpine

stages:
  - install
  - lint
  - test
  - build

cache:
  paths:
    - node_modules/

install:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/

lint:
  stage: lint
  script:
    - npm run lint

test:
  stage: test
  script:
    - npm test
  coverage: '/Lines\\s*:\\s*(\\d+\\.\\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
`,
  },
  {
    id: "gl-docker-kaniko",
    name: "Docker Build with Kaniko",
    description: "Build and push Docker images inside GitLab CI using Kaniko (no Docker-in-Docker).",
    category: "Docker",
    stars: 2740,
    author: "gitlab-org",
    tags: ["docker", "kaniko", "container"],
    filename: ".gitlab-ci.yml",
    yaml: `stages:
  - build

variables:
  IMAGE_TAG: \$CI_REGISTRY_IMAGE:\$CI_COMMIT_REF_SLUG

build-image:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.14.0-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
      --context "\${CI_PROJECT_DIR}"
      --dockerfile "\${CI_PROJECT_DIR}/Dockerfile"
      --destination "\${IMAGE_TAG}"
  rules:
    - if: \$CI_COMMIT_BRANCH == "main"
    - if: \$CI_PIPELINE_SOURCE == "merge_request_event"
`,
  },
  {
    id: "gl-sast",
    name: "SAST Security Scan",
    description: "GitLab built-in Static Application Security Testing (SAST) template.",
    category: "Security",
    stars: 4150,
    author: "gitlab-org",
    tags: ["sast", "security", "scan"],
    filename: ".gitlab-ci.yml",
    yaml: `include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

stages:
  - test

variables:
  SAST_EXCLUDED_PATHS: "spec, test, tests, tmp"

sast:
  stage: test
  artifacts:
    reports:
      sast: gl-sast-report.json
`,
  },
  {
    id: "gl-pages-deploy",
    name: "GitLab Pages Deploy",
    description: "Build and deploy a static site to GitLab Pages automatically.",
    category: "Deploy",
    stars: 2310,
    author: "gitlab-org",
    tags: ["pages", "deploy", "static"],
    filename: ".gitlab-ci.yml",
    yaml: `image: node:20-alpine

stages:
  - build
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

pages:
  stage: deploy
  script:
    - mkdir -p public
    - cp -r dist/* public/
  artifacts:
    paths:
      - public
  rules:
    - if: \$CI_COMMIT_BRANCH == "main"
`,
  },
  {
    id: "gl-semantic-release",
    name: "Semantic Release",
    description: "Automate versioning and changelog generation using semantic-release.",
    category: "Release",
    stars: 1980,
    author: "semantic-release",
    tags: ["release", "semver", "changelog"],
    filename: ".gitlab-ci.yml",
    yaml: `image: node:20

stages:
  - release

semantic-release:
  stage: release
  script:
    - npm install --save-dev semantic-release @semantic-release/gitlab @semantic-release/changelog @semantic-release/git
    - npx semantic-release
  rules:
    - if: \$CI_COMMIT_BRANCH == "main"
  variables:
    GITLAB_TOKEN: \$GITLAB_TOKEN
    GIT_AUTHOR_NAME: "Semantic Release Bot"
    GIT_AUTHOR_EMAIL: "bot@semantic-release.com"
`,
  },
  {
    id: "gl-python-ci",
    name: "Python CI Pipeline",
    description: "Lint with flake8, test with pytest, and report coverage for Python projects.",
    category: "Test",
    stars: 2050,
    author: "gitlab-org",
    tags: ["python", "pytest", "flake8"],
    filename: ".gitlab-ci.yml",
    yaml: `image: python:3.12-slim

stages:
  - lint
  - test

variables:
  PIP_CACHE_DIR: "\$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip/

lint:
  stage: lint
  script:
    - pip install flake8
    - flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

test:
  stage: test
  script:
    - pip install pytest pytest-cov
    - pip install -r requirements.txt
    - pytest --cov=. --cov-report=term --cov-report=xml
  coverage: '/TOTAL.*\s+(\d+\%)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
`,
  },
  {
    id: "gl-go-ci",
    name: "Go CI Pipeline",
    description: "Build, vet, and test a Go application across multiple stages.",
    category: "Build",
    stars: 1760,
    author: "gitlab-org",
    tags: ["go", "golang", "build"],
    filename: ".gitlab-ci.yml",
    yaml: `image: golang:1.22

stages:
  - build
  - test

variables:
  GOPATH: \$CI_PROJECT_DIR/.go
  CGO_ENABLED: "0"

cache:
  paths:
    - .go/pkg/mod/

build:
  stage: build
  script:
    - go build -v ./...

test:
  stage: test
  script:
    - go vet ./...
    - go test -race -coverprofile=coverage.out ./...
    - go tool cover -func=coverage.out
  coverage: '/total:\\s+\\(statements\\)\\s+(\\d+\\.\\d+)%/'
`,
  },
  {
    id: "gl-k8s-deploy",
    name: "Deploy to Kubernetes",
    description: "Build a Docker image and deploy it to a Kubernetes cluster using kubectl.",
    category: "Deploy",
    stars: 2180,
    author: "gitlab-org",
    tags: ["kubernetes", "k8s", "deploy"],
    filename: ".gitlab-ci.yml",
    yaml: `image: docker:24

stages:
  - build
  - deploy

variables:
  IMAGE_TAG: \$CI_REGISTRY_IMAGE:\$CI_COMMIT_SHA

build:
  stage: build
  services:
    - docker:24-dind
  before_script:
    - docker login -u \$CI_REGISTRY_USER -p \$CI_REGISTRY_PASSWORD \$CI_REGISTRY
  script:
    - docker build -t \$IMAGE_TAG .
    - docker push \$IMAGE_TAG

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config set-cluster k8s --server="\$KUBE_URL" --certificate-authority="\$KUBE_CA_PEM_FILE"
    - kubectl config set-credentials ci --token="\$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=ci
    - kubectl config use-context default
    - sed -i "s|IMAGE_TAG|\$IMAGE_TAG|g" k8s/deployment.yaml
    - kubectl apply -f k8s/
  rules:
    - if: \$CI_COMMIT_BRANCH == "main"
`,
  },
];

const ALL_GITHUB_CATEGORIES = [...new Set(GITHUB_ACTIONS.map((a) => a.category))];
const ALL_GITLAB_CATEGORIES = [...new Set(GITLAB_TEMPLATES.map((a) => a.category))];

// ─── Commit dialog ────────────────────────────────────────────────────────────
interface CommitDialogProps {
  item: MarketplaceItem;
  provider: "github" | "gitlab";
  onClose: () => void;
}

const CommitDialog: React.FC<CommitDialogProps> = ({ item, provider, onClose }) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  React.useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await api.get<any[]>(
          provider === "github" ? "/github/repos" : "/gitlab/projects"
        );
        setRepos(Array.isArray(data) ? data : []);
      } catch {
        setRepos([]);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [provider]);

  const handleCommit = async () => {
    if (!selectedRepo) return;
    setCommitting(true);
    try {
      const isGitHub = provider === "github";
      const endpoint = isGitHub ? "/github/workflow-commit" : "/gitlab/workflow-commit";
      await api.post(endpoint, {
        ...(isGitHub
          ? { owner: selectedRepo.owner?.login, repo: selectedRepo.name }
          : { projectId: selectedRepo.id }),
        filePath: item.filename,
        content: item.yaml,
        commitMessage: `ci: add ${item.name} workflow`,
      });
      setCommitted(true);
      toast({
        title: "Workflow Added! 🎉",
        description: `${item.filename} committed to ${isGitHub ? selectedRepo.full_name : selectedRepo.path_with_namespace || selectedRepo.name}`,
      });
    } catch (err: any) {
      toast({ title: "Commit Failed", description: err.message, variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Select a repository to commit <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{item.filename}</span> to:
      </p>

      {loadingRepos ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading repositories...
        </div>
      ) : repos.length === 0 ? (
        <p className="text-sm text-destructive">
          No {provider === "github" ? "GitHub" : "GitLab"} repos found. Connect your account first.
        </p>
      ) : (
        <div className="max-h-52 overflow-y-auto border rounded-md divide-y">
          {repos.map((r) => {
            const name = provider === "github" ? r.full_name : (r.path_with_namespace || r.name);
            const isSelected = selectedRepo?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRepo(r)}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  {provider === "github" ? <Github className="w-3.5 h-3.5 shrink-0" /> : <Gitlab className="w-3.5 h-3.5 shrink-0" />}
                  {name}
                </span>
                {isSelected && <CheckCheck className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleCommit}
          disabled={!selectedRepo || committing || committed}
          className={`flex items-center gap-2 ${committed ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white`}
        >
          {committing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
          ) : committed ? (
            <><CheckCheck className="w-4 h-4" /> Done!</>
          ) : (
            <><GitCommitHorizontal className="w-4 h-4" /> Commit to Repo</>
          )}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
};

// ─── Item detail modal ────────────────────────────────────────────────────────
interface ItemModalProps {
  item: MarketplaceItem | null;
  provider: "github" | "gitlab";
  onClose: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, provider, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showCommit, setShowCommit] = useState(false);

  if (!item) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {provider === "github" ? <Github className="w-5 h-5" /> : <Gitlab className="w-5 h-5" />}
            {item.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap">
            <span>{item.description}</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              {categoryIcon(item.category)} {item.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
              {item.stars.toLocaleString()}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 -mt-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              #{tag}
            </span>
          ))}
        </div>

        {/* YAML preview */}
        <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 min-h-0">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400">{item.filename}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <><CheckCheck className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 bg-slate-950 overflow-auto max-h-[340px] leading-relaxed">
            {item.yaml}
          </pre>
        </div>

        {/* Commit section */}
        {showCommit ? (
          <CommitDialog item={item} provider={provider} onClose={() => setShowCommit(false)} />
        ) : (
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => setShowCommit(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <GitCommitHorizontal className="w-4 h-4" /> Add to Repo
            </Button>
            <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
              {copied ? <><CheckCheck className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy YAML</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Marketplace card ─────────────────────────────────────────────────────────
interface MarketplaceCardProps {
  item: MarketplaceItem;
  provider: "github" | "gitlab";
  onClick: () => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, provider, onClick }) => (
  <Card
    onClick={onClick}
    className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
  >
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-blue-50 transition-colors">
            {provider === "github"
              ? <Github className="w-4 h-4 text-slate-600" />
              : <Gitlab className="w-4 h-4 text-orange-500" />}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{item.name}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          {categoryIcon(item.category)} {item.category}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
          <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
          {item.stars.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
            #{tag}
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ActionMarketplacePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"github" | "gitlab">("github");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const items = activeTab === "github" ? GITHUB_ACTIONS : GITLAB_TEMPLATES;
  const categories = activeTab === "github" ? ALL_GITHUB_CATEGORIES : ALL_GITLAB_CATEGORIES;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "github" | "gitlab");
    setSearch("");
    setSelectedCategory("All");
    setSelectedItem(null);
  };

  return (
    <div className="w-full pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-blue-500" />
          Action Marketplace
        </h1>
        <p className="text-muted-foreground">
          Browse GitHub Actions and GitLab CI templates. Preview YAML and commit workflow files directly to your repositories.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub Actions
              <span className="ml-1 text-xs text-slate-400">({GITHUB_ACTIONS.length})</span>
            </TabsTrigger>
            <TabsTrigger value="gitlab" className="flex items-center gap-2">
              <Gitlab className="w-4 h-4" /> GitLab CI Templates
              <span className="ml-1 text-xs text-slate-400">({GITLAB_TEMPLATES.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {(["github", "gitlab"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={`Search ${tab === "github" ? "GitHub Actions" : "GitLab CI templates"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {["All", ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {cat !== "All" && categoryIcon(cat)}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <p className="text-xs text-slate-400 mb-4">
              {filtered.length} {filtered.length === 1 ? "template" : "templates"} found
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
              {search && ` matching "${search}"`}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    provider={tab}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          provider={activeTab}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default ActionMarketplacePage;
