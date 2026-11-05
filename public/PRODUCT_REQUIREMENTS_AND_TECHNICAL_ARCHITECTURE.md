# Product Requirements & Technical Architecture

## SaaS Developer Operations Platform

**Document type:** Product Requirements Document (PRD) + High-Level
Technical Architecture\
**Status:** Strategy baseline --- ready for review and implementation
planning\
**Product direction:** SaaS-first, repository-centric, individual-first
with optional team capabilities\
**Important:** This document defines product scope and architecture. It
is not an implementation roadmap and does not prescribe a build order.

------------------------------------------------------------------------

# 1. Executive Summary

The product is a SaaS developer operations platform that brings
repository management, collaboration, workflow automation, application
deployment, security and monitoring into one place.

It is designed for: - Individual developers. - Freelancers managing
multiple client repositories. - Small startups and development teams. -
Developers operating applications on their own VPS infrastructure.

The platform connects to Git providers through official integrations,
organizes repositories inside workspaces, provides a unified interface
for development operations, and optionally connects to user-owned Linux
servers through a lightweight agent.

The product should not attempt to replace GitHub or GitLab. It should
build a useful operational layer across them, make common developer
tasks easier, and provide a unified experience for
repository-to-production workflows.

## Product positioning

**All-in-One Developer Operations Platform**

Suggested tagline: **One platform. Your entire development workflow.**

Core lifecycle:

Connect repository → Understand → Collaborate → Automate → Secure →
Deploy → Monitor → Improve.

## Product principles

1.  Repository-centric: repository is the main starting point for
    development tools.
2.  Individual-first: a developer can use the platform without creating
    a team or connecting a server.
3.  Team-ready: organization workspaces, predefined roles and shared
    resources are supported.
4.  Provider-independent at the product layer: GitHub and GitLab
    differences are isolated behind integration adapters.
5.  AI is optional: core product capabilities must remain useful without
    AI.
6.  Safe by default: sensitive operations require explicit authorization
    and are auditable.
7.  Modular architecture: begin with a modular monolith unless scale or
    operational needs justify service extraction.
8.  No unnecessary duplication: use Git-provider capabilities where
    appropriate and add value through unification, orchestration and
    usability.
9.  Transparent usage: users can understand subscription limits, usage
    and infrastructure-related costs.
10. Incremental extensibility: new providers, runtimes, deployment
    targets and marketplace capabilities should be addable without
    redesigning core domain concepts.

------------------------------------------------------------------------

# 2. Confirmed Product Decisions

The following decisions are the product baseline.

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Distribution                        SaaS

  Server agent                        Optional

  Git integrations                    Official GitHub App; official
                                      GitLab OAuth/application
                                      integration when GitLab support is
                                      enabled

  Billing                             Workspace-based

  Repository access                   User selects specific repositories

  Execution permissions               Approval-based, with risk-based
                                      policies

  Repository ownership                One workspace per connected
                                      repository

  Workspace roles                     Predefined roles only

  Application discovery               Automatic detection plus manual
                                      creation

  Workflow execution                  Native GitHub Actions / GitLab CI

  Application build                   Provider-side CI runners

  Artifact storage                    Provider-first hybrid

  Deployment configuration            Automatic detection with editable
                                      settings

  Initial VPS runtime                 Docker and Docker Compose

  Monitoring                          Agent-based server monitoring plus
                                      external HTTP monitoring

  Initial deployment target           User-owned Linux VPS infrastructure

  Server communication                Lightweight agent with secure
                                      outbound communication

  Marketplace                         Official verified templates and
                                      community submissions

  Initial user experience             Individual developer first; team
                                      capabilities available as needed

  Repository organization             Repository-centric, not
                                      project-centric
  -----------------------------------------------------------------------

## Recommended decisions accepted as defaults

Where no separate choice was made, this document adopts these
recommendations:

-   Use a modular monolith initially, not premature microservices.
-   Create a personal workspace automatically for every new user.
-   Use four predefined roles: Owner, Admin, Developer and Viewer.
-   Use hybrid monitoring: agent metrics for registered servers and
    external HTTP checks for public applications.
-   Use provider artifacts for non-container builds and
    provider/container registries for Docker images initially.
-   Require approval for production deployment, production rollback,
    merge and destructive operations.
-   Allow low-risk read-only operations and scans to run automatically.
-   Support staging and development automation with configurable
    approval policies.
-   Treat marketplace workflows as untrusted code until reviewed and
    verified.
-   Keep platform-managed deployment infrastructure for a later phase.

------------------------------------------------------------------------

# 3. Target Users and Use Cases

## 3.1 Individual developer

Needs: - Connect selected repositories. - View repository information. -
Perform supported repository operations. - Generate and maintain
documentation. - Install CI/CD templates. - Review workflow execution
status. - Optionally deploy applications to a VPS. - Monitor public
application availability.

The individual experience must not require team setup, server
registration or paid infrastructure.

## 3.2 Freelancer

Needs: - Separate personal and client workspaces. - Keep client
repositories and resources isolated. - Use reusable deployment and
workflow templates. - Manage several applications and servers. - Avoid
mixing client credentials, secrets, billing and permissions.

## 3.3 Startup or small development team

Needs: - Shared organization workspace. - Invite members and assign
predefined roles. - Connect selected company repositories. - Review PRs
and workflow runs. - Manage shared servers and deployments. - Approve
production changes. - Review security findings and activity history. -
Control workspace subscription and usage.

## 3.4 Platform administrator

Needs: - Manage users, workspaces and subscriptions. - Review
integration health and webhook processing. - Manage marketplace
verification. - Investigate abuse and security incidents. - Monitor
platform reliability and costs.

------------------------------------------------------------------------

# 4. Product Scope and Modules

## 4.1 Workspace and account management

### Requirements

-   Automatically create a personal workspace for a new user.
-   Allow users to create or join organization workspaces.
-   Allow one user to belong to multiple workspaces.
-   Provide a workspace switcher.
-   Keep subscriptions, settings, members, resources and usage scoped to
    a workspace.
-   Keep repositories assigned to exactly one workspace at a time.
-   Support authorized repository transfer between workspaces.
-   Disconnecting a repository must not delete the source repository
    from GitHub or GitLab.
-   Deleting a workspace must not delete external Git repositories or
    user-owned servers.
-   Provide workspace deletion safeguards, ownership transfer and
    data-retention handling.

### Workspace resource ownership

A workspace owns or manages: - Connected repository associations. -
Workspace members and roles. - Registered server records. - Applications
and environments. - Deployment configuration and history. - Workflow
installation metadata. - Workspace-level secrets and policies. -
Security findings and monitoring configuration. - Subscription and usage
records.

External resources remain owned by their external provider or user
unless explicitly stated otherwise.

## 4.2 Repository Hub

### Current capabilities reported as implemented

The user reports that the existing application already supports: -
Connecting GitHub or GitLab and importing repositories. - Viewing
repository details. - Important repository operations such as merge,
revert and rollback. - Repository-specific README generation,
preview/edit and one-click commit. - A CI/CD workflow/action marketplace
with predefined workflows and AI-assisted custom workflow creation.

These are existing capabilities to preserve and validate. This document
does not assume their implementation is complete or production-ready.

### Product requirements

-   Display connected repositories by workspace.
-   Show provider, repository name, default branch, visibility and
    connection status.
-   Show repository activity, branches, commits and PR links where
    supported.
-   Provide provider-aware repository operations.
-   Keep an audit record of platform-initiated write operations.
-   Handle revoked permissions, deleted repositories, renamed
    repositories and provider API errors.
-   Support repository disconnection and authorized workspace transfer.
-   Show the permission scope granted to the platform.

### Provider abstraction

Create a provider integration interface for common operations, such
as: - List accessible repositories. - Read repository metadata. - List
branches and commits. - Read and create pull requests where supported. -
Read workflow/pipeline status. - Install or update workflow files. -
Receive and validate webhook events. - Commit supported documentation or
configuration changes.

Do not assume GitHub and GitLab APIs are identical. Normalize common
capabilities and expose provider-specific capabilities explicitly.

## 4.3 Pull Request management

Provide a unified PR experience across supported Git providers.

### Initial capabilities

-   List open PRs/MRs across connected repositories.
-   Filter by repository, author, reviewer and status.
-   Show review state, checks, conflicts and mergeability when
    available.
-   Show PR description, changed files and provider links.
-   Show review requests and pending actions.
-   Provide links to the provider for operations not supported safely in
    the platform.

### AI PR Reviewer

Optional AI assistance may: - Summarize changes. - Identify possible
bugs. - Highlight security and performance concerns. - Detect missing
error handling or tests. - Explain the impact of changes. - Suggest
review questions.

Safety requirements: - AI findings are suggestions, not proof. - Show
file and line references where possible. - Explain uncertainty and avoid
presenting guesses as confirmed defects. - Do not auto-merge based
solely on AI approval. - Human authorization is required for merge
operations. - Respect repository permissions and provider access.

## 4.4 Documentation and AI repository assistant

AI must remain optional and usage-controlled.

Potential supported tasks: - README generation and improvement. -
Changelog generation. - CONTRIBUTING guide. - Setup and onboarding
documentation. - API documentation assistance. - Architecture
documentation. - Code and repository explanations. - Issue and PR
summaries. - Documentation consistency checks.

Requirements: - Preview before committing. - Show the target file and
proposed changes. - Allow editing and cancellation. - Require explicit
authorization before committing. - Preserve the current README workflow
already reported by the user. - Do not silently overwrite user-authored
documentation.

## 4.5 Team Workspace

### Predefined roles

Use four predefined workspace roles only in the initial product.

  Capability                        Owner           Admin           Developer      Viewer
  ------------------------------- ------- --------------- ------------------- -----------
  View workspace                      Yes             Yes                 Yes         Yes
  Manage members                      Yes             Yes                  No          No
  Manage workspace integrations       Yes             Yes                  No          No
  Manage repositories                 Yes             Yes   Limited by policy          No
  Manage servers                      Yes             Yes       No by default          No
  Work with PRs                       Yes             Yes                 Yes   Read-only
  Run permitted workflows             Yes             Yes                 Yes          No
  Approve production deployment       Yes             Yes                  No          No
  Manage billing                      Yes   No by default                  No          No
  Delete workspace                    Yes              No                  No          No

The Owner is the ultimate workspace authority. Admins should not
automatically receive billing-payment-method access or
ownership-transfer rights.

The exact meaning of "limited repository management" must be enforced
through a small set of fixed product permissions, not a custom role
builder.

### Requirements

-   Invite members by email or supported invitation mechanism.
-   Accept, reject, expire and revoke invitations.
-   Remove members and handle the last-owner case safely.
-   Maintain membership and role-change history.
-   Support a user belonging to multiple workspaces.
-   Enforce workspace isolation on every server-side request.
-   Prevent access to resources outside the user's workspace membership
    and permissions.

Custom role creation is out of initial scope.

## 4.6 Applications and repository detection

A repository may contain zero, one or multiple deployable applications.

### Application entity

An Application represents a deployable or independently managed
component inside a repository.

Examples: - React frontend. - Node.js API. - Background worker. -
Documentation website. - Monorepo service.

### Detection

When a repository is connected or rescanned: - Inspect directory
structure and known manifests. - Detect likely languages, frameworks and
package managers. - Detect possible application root directories. -
Suggest build commands and output directories. - Identify Dockerfiles
and Compose files. - Identify likely health-check and runtime
configuration candidates where possible. - Present confidence and
evidence for suggestions. - Ask users to confirm or edit detected
applications.

Detection must not silently deploy or provision databases, services or
infrastructure.

### Manual creation

Users can: - Create an application manually. - Choose its repository and
root directory. - Configure build and runtime settings. - Define
deployment targets and environments. - Add or edit health checks.

### Relationship

-   A repository can contain multiple applications.
-   An application belongs to one repository.
-   An application can have multiple environments.
-   Each environment can have multiple deployments over time.
-   A server can host multiple deployments.
-   A deployment represents one release of one application to one
    environment/target.

Do not force a one-repository-to-one-application relationship.

## 4.7 Workflow Automation

### Execution architecture

GitHub Actions and GitLab CI are the initial execution engines.

The SaaS platform manages: - Workflow discovery and installation. -
Templates and metadata. - Workflow configuration. - YAML generation and
editing. - Installation state. - Run visibility and history. - Webhook
ingestion. - Notifications and approval policies where applicable.

The Git provider remains the execution source of truth.

Do not build a proprietary CI runner in the initial version.

### Workflow categories

-   CI: build, test, lint and validation.
-   CD: release and deployment orchestration.
-   Security: dependency, secret and code scanning.
-   Utility: documentation, release notes, maintenance and repository
    tasks.

### Workflow metadata

Each template should define: - Name and description. - Author and
publisher. - Provider compatibility. - Version. - Inputs. - Required
permissions. - Required secrets and variables. - Required
tools/runtimes. - Trigger types. - Files created or modified. -
Installation instructions. - Changelog. - Verification status. - License
and support information.

### Workflow versioning

-   Pin installed workflows to an explicit version or commit.
-   Do not silently update installed workflows when a marketplace
    template changes.
-   Provide update previews and changelogs.
-   Allow users to inspect generated YAML before installation.
-   Preserve user customizations where technically possible.
-   Validate YAML and provider compatibility before committing.

### AI Workflow Builder

Optional AI capabilities: - Generate workflow YAML from a
natural-language description. - Explain an existing workflow. - Improve
performance or caching. - Identify missing permissions. - Explain
workflow failures using available logs. - Suggest safe changes.

Requirements: - Preview and edit before committing. - Validate syntax
and provider compatibility. - Display requested permissions and
secrets. - Do not execute generated workflows automatically without user
authorization. - Treat generated YAML as untrusted code.

## 4.8 Workflow Marketplace

Support: 1. Official platform-maintained templates. 2. Verified
community templates. 3. Unverified community submissions.

### Marketplace metadata

-   Title, description and category.
-   Author/publisher.
-   Version and changelog.
-   Provider compatibility.
-   Required permissions.
-   Required secrets.
-   Runtime requirements.
-   License.
-   Installation count and feedback.
-   Verification status.
-   Source repository and review information.

### Trust and security

Marketplace workflows can execute arbitrary commands in provider
runners. Therefore: - Inspect requested permissions. - Display commands
and external actions used. - Identify third-party dependencies and
pinned versions. - Review network access and secret exposure risks. - Do
not label a template verified without a documented review process. -
Provide reporting and revocation mechanisms. - Warn users before
installing unverified community templates. - Keep installation approval
explicit.

### Marketplace monetization

Future options: - Free templates. - Paid templates. - Creator revenue
sharing. - Official premium templates.

Marketplace payments and creator payouts are not required for the
initial product foundation.

## 4.9 Deployment Center

### Initial target

User-owned Linux VPS infrastructure using Docker and Docker Compose.

Platform-managed infrastructure and other cloud providers are future
scope.

### Build and release architecture

1.  Source change triggers GitHub Actions or GitLab CI.
2.  Provider runner installs dependencies, builds, tests and packages
    the application.
3.  Build produces an immutable artifact or Docker image.
4.  Artifact is stored using provider-first storage.
5.  Deployment request identifies artifact/image digest, application,
    environment and target server.
6.  Approval policy is evaluated.
7.  Deployment service dispatches an authorized job to the optional
    server agent.
8.  Agent pulls the approved artifact/image and performs the configured
    deployment.
9.  Agent reports progress and result.
10. Application health checks verify the release.
11. Deployment record is finalized.

### Build-once, promote-many

Build once and promote the same immutable artifact from staging to
production where possible.

For Docker images: - Record immutable image digest. - Do not rely solely
on mutable tags such as `latest`. - Record source commit and CI run. -
Verify the image reference before deployment.

For non-container artifacts: - Use provider artifacts initially. -
Record artifact identity, source commit, build run and
retention/availability information.

### Artifact storage

Provider-first hybrid: - Docker: use a supported provider/container
registry initially. - Non-Docker artifacts: use GitHub/GitLab artifact
storage initially. - Later: add platform-managed artifact storage if
needed.

The platform must handle expired or deleted artifacts gracefully and
explain when redeployment is impossible because the artifact is
unavailable.

### Deployment configuration

Use automatic detection plus manual editing.

Application configuration: - Repository and root directory. -
Framework/runtime. - Build command. - Output directory. - Dockerfile or
Compose path where applicable. - Port and process settings. -
Artifact/image output.

Environment configuration: - Variables and secret references. -
Server/target assignment. - Domain and port mapping. - Resource
settings. - Health-check settings. - Approval policy.

Deployment configuration: - Release artifact/image digest. - Deployment
strategy. - Container/service names. - Persistent volume requirements. -
Network and port mapping. - Pre/post-deployment checks. - Rollback
target.

Keep application, environment and deployment configuration separate.

### Environments

Support standard Development, Staging and Production environments, but
do not force users to create all three.

Production defaults: - Approval required. - Production secrets
isolated. - Deployment history retained. - Health verification required
where configured. - Rollback action available when a previous compatible
release exists.

### Deployment lifecycle

Suggested states: - Queued. - Waiting for approval. - Preparing. -
Deploying. - Verifying. - Succeeded. - Failed. - Cancelled. - Rolled
back.

### Rollback

Rollback means restoring a previously deployed release/artifact, not
reverting a Git commit.

Store: - Commit SHA. - Artifact/image digest. - Application and
environment. - Target server. - Configuration version. - Deployment logs
and result. - Health-check outcome. - Initiator and approver.

Database migrations and persistent data may not be reversible. Warn
users and do not promise safe rollback for incompatible schema/data
changes.

## 4.10 Server Management and Optional Agent

### Agent purpose

A lightweight agent installed on a user's Linux VPS.

### Agent responsibilities

-   Secure server registration.
-   Unique server identity.
-   Heartbeat and connectivity reporting.
-   CPU, memory and disk metrics.
-   OS and Docker information.
-   Container status.
-   Receive authorized deployment jobs.
-   Pull approved images/artifacts.
-   Execute narrowly scoped Docker/Compose deployment operations.
-   Return status and logs.
-   Perform configured application health checks.
-   Report agent version and update status.

### Communication

Prefer secure outbound communication from agent to SaaS. Avoid requiring
public inbound management ports.

Use: - Authenticated encrypted transport. - Per-server credentials or
certificates. - Credential rotation and revocation. - Job authorization
and replay protection. - Signed or otherwise authenticated job
payloads. - Idempotency keys. - Timeouts and safe retry behavior. -
Audit events. - Narrow operation types rather than unrestricted shell
execution.

### Agent safety

-   Do not expose an unrestricted remote terminal through the SaaS.
-   Do not log secret values.
-   Restrict filesystem and Docker operations to configured deployment
    scopes where practical.
-   Separate agent control credentials from application secrets.
-   Require explicit approval for production/destructive operations.
-   Provide agent disconnect/revoke functionality.
-   Fail safely when SaaS connectivity is lost.
-   Document what the agent can access and execute.

### Initial OS/runtime scope

Start with supported Linux VPS distributions and Docker/Compose. Ubuntu
and RHEL/Rocky-family compatibility are reasonable initial targets,
subject to testing. Windows servers and Kubernetes are future scope.

## 4.11 Security Center

Initial capabilities: - Dependency vulnerability scanning. - Secret
scanning. - Code security analysis. - License checking.

### Finding data

Each finding should include: - Workspace and repository. - Commit SHA
and scan identifier. - Scanner/rule identifier. - Severity and
confidence where available. - File and line reference where available. -
Description and remediation guidance. - First detected and last detected
timestamps. - Current status and history.

### Requirements

-   Show scan time and coverage.
-   Distinguish unresolved, fixed, dismissed and accepted-risk findings.
-   Preserve finding history.
-   Avoid claims such as "100% secure."
-   Support rescanning.
-   Avoid exposing secret values in findings or logs.
-   Allow authorized dismissal with a reason.
-   Keep scanner output traceable to the commit analyzed.

## 4.12 Monitoring Center

Support both agent-based and external HTTP monitoring.

### Server monitoring through agent

-   Heartbeat/connectivity.
-   CPU, memory and disk.
-   Docker daemon and container status.
-   Agent health/version.
-   Resource thresholds and history.

### External application monitoring

-   HTTP/HTTPS availability.
-   Response status.
-   Response time.
-   Configurable health-check path.
-   Check interval and timeout.
-   Failure/recovery events.
-   Basic uptime history.

External HTTP monitoring works without an agent and can monitor
applications hosted on other providers.

It cannot report host CPU, memory, Docker or container metrics without
an agent or provider-specific integration.

### Application monitoring

-   HTTP health.
-   Container health when available.
-   Deployment status.
-   Availability and response time.
-   Basic alerting.

Advanced distributed tracing, log analytics and full observability are
future scope.

## 4.13 Unified Activity and Notification Center

Provide one actionable activity center across modules.

Examples: - PR awaiting review. - Workflow failed. - Security finding
detected. - Production deployment awaiting approval. - Deployment
failed. - Server disconnected. - Application health check failed. -
Invitation received.

Each activity should: - Have a source module and resource link. -
Include severity/priority where appropriate. - Show timestamp and
current state. - Support read/unread or resolved state as appropriate. -
Link directly to a relevant action. - Respect workspace membership and
permissions.

Do not build disconnected notification implementations for every module.

## 4.14 Release Management

Potential capabilities: - Release history. - Tag and version
information. - Changelog generation. - Release notes preview/edit. -
Associate release with commit/PR. - Link release to deployment. - Show
deployment status by environment.

Use provider-native release features where available and add unified
cross-provider visibility.

## 4.15 Integrations

Initial Git integrations: - GitHub App. - Official GitLab
OAuth/application integration when GitLab is supported.

Requirements: - User selects repositories. - Request least-privilege
permissions. - Handle installation/revocation. - Validate webhook
signatures. - Handle retries and duplicate webhook events
idempotently. - Track API rate limits. - Securely store and rotate
credentials. - Show connection health and required reauthorization.

Future integrations may include external monitoring, error tracking,
cloud registries, notification channels and issue trackers. Do not build
every integration before the core platform is stable.

------------------------------------------------------------------------

# 5. Core Domain Model and Relationships

The domain model should reflect the product's repository-centric
structure.

## 5.1 Main entities

  -----------------------------------------------------------------------
  Entity                              Purpose
  ----------------------------------- -----------------------------------
  User                                Identity and authentication

  Workspace                           Billing, membership, settings and
                                      resource boundary

  WorkspaceMembership                 User's role in a workspace

  GitProviderConnection               Authorized Git provider
                                      installation/account connection

  Repository                          Workspace-owned connection to an
                                      external repository

  Application                         Deployable component within a
                                      repository

  Environment                         Application deployment environment

  WorkflowTemplate                    Marketplace or reusable workflow
                                      definition

  WorkflowInstallation                Installed workflow associated with
                                      a repository

  WorkflowRun                         Provider-native execution record

  ArtifactReference                   Immutable reference to build
                                      output/image

  Server                              Registered user-owned
                                      infrastructure

  ServerAgent                         Agent identity, version and
                                      connectivity

  Deployment                          Release of an application to an
                                      environment/target

  DeploymentApproval                  Approval decision and audit
                                      information

  SecurityScan                        Scan execution record

  SecurityFinding                     Individual finding

  Monitor                             Server or external application
                                      monitoring configuration

  MonitorCheck                        Individual check result

  ActivityEvent                       Unified event/activity record

  Notification                        User/workspace notification state

  Subscription                        Workspace plan

  UsageRecord                         Metered consumption

  AuditEvent                          Security-sensitive operation
                                      history
  -----------------------------------------------------------------------

## 5.2 Key relationships

-   User belongs to many workspaces through WorkspaceMembership.
-   Workspace has many members.
-   Workspace has many repositories.
-   A connected repository belongs to exactly one workspace at a time.
-   GitProviderConnection can authorize access to multiple selected
    repositories.
-   Repository has zero or more applications.
-   Application belongs to one repository.
-   Application has one or more optional environments.
-   Environment has many deployments.
-   Workspace can register many servers.
-   Server can host many deployments.
-   WorkflowInstallation belongs to a repository and references a
    template/version.
-   WorkflowRun belongs to a provider workflow and repository.
-   Deployment references an application, environment, artifact and
    target server.
-   SecurityScan belongs to a repository/commit; SecurityFinding belongs
    to a scan.
-   Monitor can target a server or an external application endpoint.
-   Workspace owns subscription and usage records.

## 5.3 Important invariants

1.  A repository cannot be active in two workspaces simultaneously.
2.  Every workspace-scoped record must be checked against workspace
    authorization.
3.  A deployment must identify its application, environment, artifact
    and target.
4.  A production deployment must pass the configured approval policy.
5.  A deployment must not use an artifact from an unrelated
    repository/commit without explicit authorization.
6.  A disconnected provider connection must not allow new operations.
7.  A revoked server agent must not receive new jobs.
8.  Audit records for sensitive actions should be append-only or
    tamper-evident.
9.  Secrets must not be stored in ordinary configuration fields or
    returned by normal read APIs.
10. Deleting a platform record must not unexpectedly delete external
    infrastructure.

------------------------------------------------------------------------

# 6. High-Level Technical Architecture

## 6.1 Recommended starting architecture

Use a **modular monolith** initially.

A modular monolith means: - One main backend deployment. - Clear domain
modules. - Explicit module interfaces. - Shared authentication and
authorization. - Background workers for asynchronous tasks. - External
provider adapters. - Ability to extract services later when justified.

Do not start with many microservices. They increase deployment,
debugging, observability and data-consistency complexity.

## 6.2 Logical modules

1.  Identity and Authentication.
2.  Workspace and Membership.
3.  Billing and Usage.
4.  Git Provider Integrations.
5.  Repository Management.
6.  Pull Request Management.
7.  Documentation and AI.
8.  Application Discovery.
9.  Workflow and Marketplace.
10. Artifact References.
11. Deployment Orchestration.
12. Server and Agent Management.
13. Security Scanning.
14. Monitoring.
15. Activity and Notifications.
16. Audit and Administration.

## 6.3 Logical architecture diagram

``` text
Web Frontend
    |
    v
SaaS Backend / API
    |
    +-- Identity & Workspace
    +-- Git Provider Adapters
    +-- Repository & PR
    +-- AI Tools
    +-- Application Discovery
    +-- Workflow & Marketplace
    +-- Deployment Orchestrator
    +-- Server / Agent Manager
    +-- Security Center
    +-- Monitoring
    +-- Billing & Usage
    +-- Activity / Audit
    |
    +--> Relational Database
    +--> Queue / Background Workers
    +--> Secret Management
    +--> Cache (when required)
    |
    +--> GitHub App / GitLab Integration
    +--> Provider CI Runners
    +--> Provider Artifact / Container Registries
    +--> External HTTP Monitoring
    +--> Optional VPS Agents
```

## 6.4 Data storage guidance

Use a relational database for core product entities and relationships.

Use object storage only when needed for larger artifacts, exports or
retained files. Initially, provider artifact storage is preferred.

Use a queue for: - Webhook processing. - Repository synchronization. -
Application detection. - AI jobs. - Security scans. - Monitoring
checks. - Deployment orchestration. - Notifications.

Use idempotency and retry policies for all asynchronous provider events
and job dispatches.

## 6.5 Frontend navigation proposal

-   Overview
-   Development
    -   Repositories
    -   Pull Requests
    -   Issues (future or provider-integrated)
    -   Releases
    -   Documentation
-   Automation
    -   Workflows
    -   Marketplace
    -   AI Tools
-   Operations
    -   Applications
    -   Deployments
    -   Servers
    -   Security
    -   Monitoring
-   Workspace
    -   Members
    -   Activity
    -   Billing
    -   Integrations
    -   Settings

Navigation should adapt to user permissions and available integrations.
Do not show empty operational sections as mandatory setup steps.

------------------------------------------------------------------------

# 7. API and Integration Boundaries

Exact routes and payload schemas should be designed against the existing
codebase before implementation. The following are logical API
boundaries, not a final route contract.

## Workspace

-   Create/list/update workspace.
-   Switch active workspace.
-   Invite/remove member.
-   Change predefined role.
-   View workspace usage and subscription.

## Git integration

-   Start GitHub App installation.
-   Complete GitLab OAuth flow.
-   List authorized repositories.
-   Select/import repository.
-   Disconnect repository.
-   Transfer repository between workspaces.
-   Receive provider webhooks.

## Repository

-   List repositories.
-   Read repository details.
-   Read branches/commits.
-   Perform supported repository operations.
-   Generate and commit documentation with preview/authorization.

## Application

-   Scan repository for applications.
-   Confirm detected application.
-   Create/edit application.
-   Configure environments.
-   Validate deployment configuration.

## Workflow

-   Browse templates.
-   Preview template/version.
-   Install workflow.
-   Update workflow with diff/preview.
-   Read workflow runs and logs/status from provider.
-   Generate YAML with AI preview.
-   Validate YAML.

## Deployment

-   Create deployment request.
-   Evaluate approval policy.
-   Approve/reject deployment.
-   Dispatch authorized deployment job.
-   Read deployment status/logs.
-   Request rollback to a previous release.

## Server agent

-   Register server.
-   Revoke server/agent.
-   Receive heartbeat.
-   Report metrics and Docker status.
-   Poll/receive authorized jobs.
-   Report job progress/result.

## Security and monitoring

-   Start security scan.
-   Ingest scan result.
-   List findings.
-   Configure monitor.
-   Submit monitor result.
-   Read uptime and incident history.

All APIs must enforce workspace membership, role permissions, resource
ownership and operation-specific authorization server-side. Frontend
hiding is not authorization.

------------------------------------------------------------------------

# 8. Security, Privacy and Operational Requirements

## 8.1 Authentication and authorization

-   Use secure session/cookie handling appropriate to the existing
    application architecture.
-   Enforce server-side authorization for every workspace resource.
-   Use least-privilege Git provider scopes.
-   Support disconnect and revocation.
-   Protect account and workspace administration operations.
-   Avoid relying on client-side state as the source of authorization
    truth.

## 8.2 Secrets

-   Store provider credentials and deployment secrets in a dedicated
    secure secret-management mechanism.
-   Encrypt sensitive credentials at rest.
-   Restrict secret access to the specific operation that needs them.
-   Avoid returning secret values through read APIs.
-   Redact secrets from logs, error messages and workflow output where
    feasible.
-   Support rotation and revocation.
-   Separate workspace secrets from environment-specific deployment
    secrets.

## 8.3 Webhooks

-   Validate provider signatures/tokens.
-   Reject invalid requests.
-   Handle retries and duplicate events idempotently.
-   Persist event receipt before asynchronous processing where
    appropriate.
-   Track processing status and failures.
-   Avoid trusting webhook payloads as authorization by themselves.

## 8.4 Deployment safety

-   Approval before production changes.
-   Approval before destructive operations.
-   Validate target server and artifact.
-   Prevent cross-workspace deployment.
-   Record initiator, approver and execution result.
-   Provide cancellation and timeout behavior.
-   Do not expose unrestricted shell execution as a normal product
    feature.

## 8.5 Privacy

-   Keep workspace data isolated.
-   Explain which repository data is accessed.
-   Explain what the server agent collects and executes.
-   Allow users to disconnect integrations and revoke agents.
-   Define retention for logs, metrics, artifacts and AI inputs.
-   Do not use private repository content for model training unless
    explicitly authorized under a clearly documented policy.

## 8.6 Reliability

-   Retry transient provider/network failures with bounded backoff.
-   Use idempotency for deployment and webhook jobs.
-   Track queue failures and dead-letter/recovery cases.
-   Show stale integration/agent states.
-   Distinguish unknown status from successful status.
-   Avoid claiming a deployment succeeded until execution and configured
    verification complete.

## 8.7 Audit history

Record at minimum: - Member invitation/removal and role changes. - Git
integration connect/disconnect. - Repository
import/disconnect/transfer. - Workflow install/update/execute where
applicable. - Deployment request/approval/rejection/result. -
Rollback. - Server registration/revocation. - Secret configuration
changes (never the secret value). - Workspace subscription and ownership
changes.

------------------------------------------------------------------------

# 9. Billing and Monetization Strategy

Billing is workspace-based.

## 9.1 Personal workspace

Free plan by default, designed to encourage repository connection and
ongoing usage.

Potential free capabilities: - Basic repository management. -
Documentation tools with reasonable limits. - Public marketplace
access. - Basic repository insights. - Limited automation/AI usage. -
External HTTP monitoring with modest limits, subject to final packaging.

## 9.2 Organization workspace

Paid plans can include: - More members. - Shared repositories and
permissions. - Shared workflows. - Team activity. - Deployment and
server management. - Advanced security. - Monitoring retention and
alerting. - Audit history.

## 9.3 Usage dimensions

Keep these dimensions separate: - Subscription entitlements: members,
connected repositories, private templates, features. - Metered usage: AI
calls/credits, scans, monitoring checks, retained history. -
Infrastructure cost: platform-hosted storage, compute and deployments if
offered later.

Do not price platform-managed compute as if it were cost-free.
Usage-based pricing may be appropriate for future managed
infrastructure.

Exact prices and limits are not defined in this document.

------------------------------------------------------------------------

# 10. User Journeys

## 10.1 New individual developer

1.  Create account.
2.  Personal workspace is created automatically.
3.  Connect GitHub through GitHub App.
4.  Select specific repositories.
5.  Import repository.
6.  View repository overview.
7.  Discover available documentation, workflow and security tools.
8.  Optionally create/detect an application.
9.  Optionally connect a VPS agent when deployment is needed.

No team, server or deployment setup should be mandatory.

## 10.2 Create organization workspace

1.  Create organization workspace.
2.  Set workspace name and basic settings.
3.  Invite members.
4.  Assign predefined roles.
5.  Connect Git provider.
6.  Select repositories.
7.  Configure shared tools and policies.
8.  Choose workspace subscription.

## 10.3 Install marketplace workflow

1.  Open marketplace.
2.  Filter by provider, language, category and verification.
3.  Inspect template version, permissions, commands and required
    secrets.
4.  Preview generated workflow YAML.
5.  Configure inputs.
6.  Confirm installation.
7.  Commit workflow file to repository.
8.  Read native provider execution status in the platform.

## 10.4 Deploy an application to a VPS

1.  Connect repository.
2.  Detect or manually create application.
3.  Review build configuration.
4.  Create environment.
5.  Register VPS using optional agent.
6.  Configure Docker deployment and secrets.
7.  Configure provider-side CI build.
8.  Build and publish artifact/image.
9.  Request deployment.
10. Obtain approval according to environment policy.
11. Agent deploys the approved artifact/image.
12. Run health checks.
13. Display result and monitoring state.

## 10.5 Monitor an externally hosted application

1.  Create or select application.
2.  Add public HTTP/HTTPS endpoint.
3.  Configure health path, interval and timeout.
4.  Run checks.
5.  Show uptime and response-time history.
6.  Notify users of failures and recovery.

No server agent is needed for external HTTP checks.

------------------------------------------------------------------------

# 11. Product Experience and Dashboard

## Individual dashboard

Prioritize: - Recent repositories. - Recent PRs. - Workflow status. -
Security findings. - Applications and deployments if configured. -
Important activity.

## Organization dashboard

Additionally prioritize: - Team activity. - Repository overview. -
Pending reviews. - Production deployment state. - Security issues. -
Server and application health. - Workspace usage.

Do not force users to configure modules they do not use. Empty states
should explain value and provide an optional setup action.

------------------------------------------------------------------------

# 12. Non-Functional Requirements

## Performance

-   Paginate repository, PR, workflow, deployment and activity lists.
-   Use background jobs for long-running operations.
-   Avoid blocking normal API requests on provider calls or scans.
-   Cache provider data carefully with freshness indicators.
-   Handle provider rate limits.

## Scalability

-   Keep modules independently understandable.
-   Use asynchronous jobs for expensive work.
-   Avoid premature microservices.
-   Design workspace-scoped queries and indexes.
-   Make webhook processing horizontally scalable.

## Accessibility and usability

-   Clear loading, empty, error and permission-denied states.
-   Accessible forms and keyboard navigation.
-   Confirm destructive actions.
-   Explain provider connection and agent permissions.
-   Show actionable errors rather than raw stack traces.

## Observability

-   Structured application logs.
-   Correlation/request IDs.
-   Queue and worker metrics.
-   Provider integration health.
-   Webhook processing metrics.
-   Deployment execution status.
-   Agent connectivity metrics.
-   Alerting for platform-level failures.

------------------------------------------------------------------------

# 13. Initial Scope Versus Future Scope

## Core product foundation

The existing implemented capabilities reported by the user should be
preserved and verified: - GitHub/GitLab repository connection and
import. - Repository details. - Supported repository operations. -
README generation, preview/edit and commit. - Workflow/action
marketplace. - AI-assisted workflow creation.

The broader product should build on this foundation.

## Planned product capabilities

-   Workspace and predefined membership roles.
-   Unified PR experience.
-   Application discovery and manual creation.
-   Native provider workflow management and unified run visibility.
-   VPS/Docker deployment management.
-   Optional server agent.
-   Security Center.
-   AI PR review.
-   AI workflow builder improvements.
-   External HTTP and agent-based monitoring.
-   Unified activity center.
-   Workspace billing and usage.

## Future expansion

-   Platform-managed deployment infrastructure.
-   Additional cloud providers.
-   Kubernetes.
-   Windows server agent.
-   Custom workspace roles.
-   Advanced log analytics and distributed tracing.
-   Advanced issue/project management.
-   Marketplace payments and creator payouts.
-   Enterprise SSO and advanced compliance features.
-   More integrations and deployment runtimes.

These are future possibilities, not commitments for the first release.

------------------------------------------------------------------------

# 14. Important Product Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Scope becomes too broad             Keep repository workflow as the
                                      core journey; add modules
                                      incrementally

  Rebuild GitHub/GitLab functionality Use provider APIs and focus on
  unnecessarily                       cross-provider orchestration and UX

  Unsafe marketplace workflows        Permissions preview, version
                                      pinning, review and explicit
                                      installation

  Server agent becomes remote shell   Narrow job types, outbound-only
                                      connection, authorization and audit

  Secret leakage                      Dedicated secret handling,
                                      redaction and least privilege

  Deployment rollback is unsafe       Immutable artifacts, deployment
                                      history and migration warnings

  Provider API outages/rate limits    Queues, bounded retries, caching
                                      and clear stale status

  Billing becomes unpredictable       Separate plan entitlements, metered
                                      usage and infrastructure costs

  AI produces incorrect findings      Human review, evidence references
                                      and uncertainty labels

  Team permission leaks               Server-side workspace/resource
                                      authorization and isolation tests

  Agent or server compromised         Credential revocation, narrow
                                      permissions and job authentication

  Monitoring produces false           Distinguish server health from
  confidence                          application health and show check
                                      coverage
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 15. Acceptance Criteria for the Product Architecture

The product architecture is considered adequately defined when:

1.  Every workspace-owned resource has an explicit workspace boundary.
2.  A repository can belong to only one workspace at a time.
3.  Workspace roles are predefined and consistently enforced
    server-side.
4.  GitHub/GitLab provider-specific code is isolated behind integration
    adapters.
5.  Workflow execution remains native to GitHub Actions/GitLab CI
    initially.
6.  Provider workflow status is traceable to the original provider run.
7.  Applications are separate from repositories and support monorepos.
8.  Environments are separate from applications and deployments.
9.  Deployment records reference immutable artifacts/images where
    possible.
10. Production deployment approval is enforced by backend policy.
11. Optional server agents use authenticated, revocable identities.
12. Agent jobs are narrowly scoped and auditable.
13. Monitoring distinguishes server metrics from external application
    checks.
14. Security findings are traceable to scans and commits.
15. Marketplace templates have versions, permissions and trust status.
16. Secrets are never exposed through ordinary configuration reads or
    logs.
17. Billing and usage are scoped to workspaces.
18. Existing working features are preserved during future
    implementation.
19. Long-running work is asynchronous and has observable status.
20. The product remains useful to an individual developer who does not
    use teams, AI, deployments or a server agent.

------------------------------------------------------------------------

# 16. Guidance for Future Implementation Planning

This document is a product and architecture baseline, not permission to
rewrite the existing application.

Before implementation planning: - Inspect the current frontend and
backend structure. - Identify existing modules, database models, routes
and integrations. - Map implemented features to the requirements in this
document. - Identify partial implementations and technical debt. -
Identify conflicts between current architecture and the proposed
architecture. - Preserve existing functionality unless a change is
explicitly justified. - Prefer incremental changes and
backward-compatible migrations. - Define acceptance criteria and tests
for each implementation unit. - Verify Git provider behavior against
actual provider API capabilities. - Do not introduce microservices,
Kubernetes or a proprietary CI runner without a concrete need.

The later implementation plan should separate: - Already implemented and
verified. - Implemented but incomplete or needing improvement. -
Missing. - Deferred future scope.

No implementation order is prescribed here. That should be determined
after reviewing the existing codebase.

------------------------------------------------------------------------

# 17. Final Product Definition

The product is a SaaS, repository-centric Developer Operations Platform
for individual developers and small teams.

It connects Git repositories, provides unified development tools,
manages native CI/CD workflows, supports optional Docker-based VPS
deployment through a secure server agent, and brings security and
monitoring into one workspace-based experience.

The platform should make the developer's path from source code to a
healthy running application easier without forcing users into
unnecessary infrastructure, team setup or AI features.

**Core promise:** Manage your development workflow from repository to
production in one platform, while retaining control over your code,
infrastructure and approvals.
