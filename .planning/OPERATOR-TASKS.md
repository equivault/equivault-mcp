# equivault-mcp — Operator Manual Tasks

Things that can't be driven by Claude and need to be done by you (the operator) in a browser or via a personal account. Each task is self-contained: open the link, follow the numbered steps, check off.

> **Priority legend**
> 🔴 **Blocking** — nothing downstream works until this is done
> 🟡 **Important** — unlocks discoverability / stability improvements
> 🟢 **Nice to have** — polish / growth

---

## 🔴 TASK 1 — Configure `NPM_TOKEN` so releases actually publish

**Why**: Every tag pushed (v0.1.0, v0.2.0, v0.3.0, v1.0.0, v1.0.1) triggered the `Publish to npm` workflow. All five failed because the GitHub Actions runner has no token. Until this is fixed, the package is on GitHub but **not on npm** — no one can `npx equivault-mcp`.

**Estimated time**: ~5 minutes

### Step 1.1 — Get your npm account ready

1. Go to https://www.npmjs.com/login (sign in or create an account).
2. Make sure your email is verified — npm blocks publishing from unverified accounts.
3. If this is a fresh account: enable 2FA at https://www.npmjs.com/settings/your-username/tfa (required for publishing by default).

### Step 1.2 — Generate an automation token

1. Go to https://www.npmjs.com/settings/your-username/tokens.
2. Click **Generate New Token** → **Classic Token**.
3. Select token type: **Automation** (bypasses 2FA for CI runs).
4. Click **Generate Token**.
5. Copy the token (starts with `npm_...`). You only see it once.

> **⚠️ Gotcha — do not use a Granular Access Token for the first publish.** GATs default to "select specific packages" scope. For a package that doesn't exist on npm yet, the GAT can't be scoped to it, so the first `npm publish` returns `403 Forbidden` even with a valid token. Use the Classic Automation token for the initial claim. Once `equivault-mcp` exists on npm, you can rotate to a GAT scoped to it for tighter security.
>
> If you already created a GAT and saw the 403: revoke it, create a Classic Automation token, publish once, then (if desired) rotate back to a GAT with `equivault-mcp` now explicitly in its scope list.

### Step 1.3 — Add the token to the GitHub repo secrets

1. Go to https://github.com/equivault/equivault-mcp/settings/secrets/actions.
2. Click **New repository secret**.
3. Name: `NPM_TOKEN` (exact case — the workflow reads this name).
4. Secret: paste the token from Step 1.2.
5. Click **Add secret**.

### Step 1.4 — Verify the package name is yours on npm

1. Go to https://www.npmjs.com/package/equivault-mcp.
2. If it says "Package not found" — good, the name is free.
3. If it exists under another owner — **stop**. You'll need to pick a different name (e.g. `@equivault/mcp` scoped to your npm org) and update `package.json`'s `name` field before tagging a new release.

### Step 1.5 — Re-run one of the failed publish workflows

1. Go to https://github.com/equivault/equivault-mcp/actions.
2. Filter to **Publish to npm** workflow runs (four failed: v0.1.0, v0.2.0, v0.3.0, v1.0.0, v1.0.1).
3. Pick the **latest** (v1.0.1) — re-running it publishes the current state. Click the run → **Re-run all jobs**.
4. Watch the logs. The `npm publish` step should succeed and print the tarball URL.

### Step 1.6 — Verify the package is live

```bash
npm view equivault-mcp
```

Should show version 1.0.1, the readme, and all 38 tools described.

Then test as a real user would:

```bash
EQUIVAULT_API_KEY=test EQUIVAULT_TENANT_ID=test npx -y equivault-mcp
```

(Will exit immediately because the key is fake, but confirms the package is installable.)

### Step 1.7 — (Optional) Back-fill earlier versions

If you want v0.1.0..v1.0.0 on npm too (for historical completeness): re-run each of their failed workflows. Each will publish its respective version. Skip if you're happy starting history at v1.0.1.

✅ **Done when**: `npm view equivault-mcp version` returns `1.0.1`.

---

## 🟡 TASK 2 — Follow up on awesome-mcp-servers PR #5036

**Why**: The PR adding `equivault/equivault-mcp` to the Finance & Fintech section is open at https://github.com/punkpeye/awesome-mcp-servers/pull/5036. The maintainer (@punkpeye) reviews these in batches. Once merged, the MCP becomes discoverable to the ~85k people watching that repo.

**Estimated time**: 2 minutes every 3 days until merged

### Step 2.1 — Subscribe to PR notifications

1. Open https://github.com/punkpeye/awesome-mcp-servers/pull/5036.
2. Click the **Watch** dropdown (top right of the PR) → **All Activity**. You get email/web notifications on any comment.

### Step 2.2 — Watch for maintainer feedback

Common feedback patterns on this list:
- **Alphabetical position** — maintainer may move your entry. No action needed unless asked.
- **Description length** — the list convention leans short. Our entry is on the longer side; if the maintainer asks to shorten, rewrite to a single sentence (keep `🎖️ 📇 ☁️` prefix).
- **Badge validation** — glama.ai badges are common in the list. Consider adding one (see Task 5).
- **Duplicate / typo** — trivial fixes, just push another commit to the branch.

### Step 2.3 — If changes requested, update the fork branch

```bash
cd /tmp/fork-work/awesome-mcp-servers
git checkout add-equivault-mcp
# edit README.md per feedback
git add README.md
git commit -m "Address PR feedback"
git push origin add-equivault-mcp
```

The PR picks up the new commits automatically.

### Step 2.4 — After merge

Once merged, the entry is live at https://github.com/punkpeye/awesome-mcp-servers#finance--fintech. You can then:

- Delete the local clone at `/tmp/fork-work/awesome-mcp-servers` (optional cleanup)
- Keep the fork at https://github.com/equivault/awesome-mcp-servers to make future list updates easy (when v1.1.0 ships, you'll want to update the description)

✅ **Done when**: PR is merged, entry appears on the upstream README.

---

## 🟡 TASK 3 — Submit to glama.ai MCP registry

**Why**: glama.ai hosts https://glama.ai/mcp/servers — a second canonical MCP registry with built-in scoring and a badge system. Many entries in awesome-mcp-servers use the glama badge. Being listed there gives the MCP a quality score that becomes a trust signal.

**Estimated time**: ~10 minutes

### Step 3.1 — Submit the repo

1. Go to https://glama.ai/mcp/servers/submit.
2. Enter the repo URL: `https://github.com/equivault/equivault-mcp`.
3. Submit. The glama crawler indexes the repo (takes up to 24 hours).

### Step 3.2 — Grab the badge

1. Once indexed, go to your server page at `https://glama.ai/mcp/servers/<slug>`.
2. The page has a **Badge** section with a markdown snippet — copy it.

### Step 3.3 — Add the badge to the README

Edit `/Users/svparijs/Projects/AI/equivault-mcp/README.md`. In the badge row near the top, add the glama badge:

```markdown
<a href="https://glama.ai/mcp/servers/<slug>">
  <img src="https://glama.ai/mcp/servers/<slug>/badge" alt="glama.ai score"/>
</a>
```

Commit as `chore: add glama.ai badge`, push, tag a patch release (v1.0.2) if you want it on npm quickly — otherwise it lands at the next release.

### Step 3.4 — (Optional) Update the awesome-mcp-servers entry to use the glama badge

If PR #5036 isn't merged yet: update your branch to use the badge format other entries use:

```markdown
- [equivault/equivault-mcp](https://github.com/equivault/equivault-mcp) [![equivault/equivault-mcp MCP server](https://glama.ai/mcp/servers/<slug>/badges/score.svg)](https://glama.ai/mcp/servers/<slug>) 🎖️ 📇 ☁️ - Official [EquiVault]...
```

Push the update to your fork. The PR picks it up.

✅ **Done when**: glama.ai shows `equivault-mcp` with a score, badge displays in the README.

---

## 🟡 TASK 4 — Platform-side: add `X-EquiVault-Version` response header

**Why**: `equivault-mcp` v1.0.1's runtime compat check reads this header. Until the platform sets it, every MCP-to-API call sees `null`, the check stays silent, and drift is invisible to users. Five lines of code in `equivault-api` unlock the entire alignment feature.

**Estimated time**: ~20 minutes (including the test)

**Tracked as a pre-ship task in `.planning/milestones/v1.6.0-ROADMAP.md` → "Pre-ship platform tasks for MCP alignment".** You can do this as a GSD quick task, a phase insertion, or just squeeze it into the next phase PR.

### Step 4.1 — Add the middleware

Edit `/Users/svparijs/Projects/AI/EQ2/equivault-api/src/main.py` (or wherever the FastAPI `app` is created):

```python
from src.core.config import settings

@app.middleware("http")
async def add_version_header(request, call_next):
    response = await call_next(request)
    response.headers["X-EquiVault-Version"] = settings.app_version
    return response
```

(Place after the existing CORS / auth middleware — order doesn't matter for response headers.)

### Step 4.2 — Add an integration test

In `/Users/svparijs/Projects/AI/EQ2/equivault-api/tests/test_main.py` (or similar):

```python
async def test_x_equivault_version_header_is_set(async_client):
    response = await async_client.get("/api/v1/health")
    assert "x-equivault-version" in {k.lower() for k in response.headers}
    assert response.headers["x-equivault-version"] == settings.app_version
```

### Step 4.3 — Run tests, commit, open MR

```bash
cd equivault-api
source .venv/bin/activate
python -m pytest tests/test_main.py -v
```

Should pass. Commit on a feature branch (e.g. `feat/x-equivault-version-header`), push, open MR.

### Step 4.4 — Verify in staging

Once merged and deployed, hit any endpoint and check the response headers:

```bash
curl -I -H "Authorization: Bearer <test-key>" -H "X-Tenant-ID: <tenant>" https://staging.api.equivault.ai/api/v1/health
```

Should include `X-EquiVault-Version: 1.6.0` (or whatever the deployed version is).

### Step 4.5 — Verify MCP picks it up

With staging deployed, configure a Claude Desktop session pointed at staging:

```json
{
  "mcpServers": {
    "equivault": {
      "command": "npx",
      "args": ["-y", "equivault-mcp"],
      "env": {
        "EQUIVAULT_API_KEY": "<test-key>",
        "EQUIVAULT_TENANT_ID": "<tenant>",
        "EQUIVAULT_BASE_URL": "https://staging.api.equivault.ai/api/v1"
      }
    }
  }
}
```

If platform is still at v1.5.x, no warning. If platform is at v1.6.0, you'll see:

> `equivault-mcp: platform version check — Platform 1.6.0 is outside the compat range >=1.3.0 <1.6.0.`

That's the alignment loop closing — exactly the signal that tells a user to upgrade the MCP.

✅ **Done when**: Header appears on responses in staging + production; MCP v1.0.1 warns on version drift.

---

## 🟢 TASK 5 — Update awesome-mcp-servers description when v1.1.0 ships

**Why**: The entry added in Task 2 describes 38 tools. v1.1.0 will add ~3–5 new tools. When it ships, update the upstream entry so the description stays accurate.

**Estimated time**: ~10 minutes, whenever v1.1.0 ships

### Step 5.1 — Fork is already yours

You should still have https://github.com/equivault/awesome-mcp-servers (the Task 2 fork). Pull the latest upstream:

```bash
cd /tmp/fork-work/awesome-mcp-servers  # or re-clone if cleaned up
git fetch upstream main
git checkout main
git merge upstream/main
git push origin main
```

### Step 5.2 — Update the description

```bash
git checkout -b update-equivault-mcp-v1.1
# edit README.md — find the equivault/equivault-mcp line, update tool count
# and any new capability mentions (e.g. "+ OAuth option", "+ analyst ratings")
git commit -m "Update equivault-mcp description for v1.1.0"
git push origin update-equivault-mcp-v1.1
```

### Step 5.3 — Open PR

Same pattern as Task 2 — `gh pr create --repo punkpeye/awesome-mcp-servers`.

✅ **Done when**: merged upstream.

---

## 🟢 TASK 6 — Submit to MCP registry (mcp.run or successor)

**Why**: As the MCP ecosystem matures, a "canonical registry" seems likely. When one emerges (mcp.run, @claude/registry, GitHub's MCP directory), submit `equivault-mcp` there too.

**Estimated time**: 15 minutes when the registry exists

### Step 6.1 — Watch for registry announcements

- MCP GitHub Discussions: https://github.com/modelcontextprotocol/typescript-sdk/discussions
- Anthropic MCP announcements: https://www.anthropic.com/news (filter for MCP)
- GitHub's MCP registry (if it ships): https://github.com/mcp

### Step 6.2 — Register the server

Each registry has different submission requirements. At minimum expect to provide:

- Repo URL: https://github.com/equivault/equivault-mcp
- npm package name: `equivault-mcp`
- Category: Finance / Fintech
- Short description (reuse from awesome-mcp-servers entry)
- Official badge request (if the registry has one)

### Step 6.3 — Add registry badges to README

Same pattern as Task 3.

✅ **Done when**: Server appears in at least one first-party or canonical third-party registry.

---

## Task dependency graph

```
Task 1 (NPM_TOKEN) ─┬─► Task 3 (glama.ai — needs package live to score)
                    └─► Task 6 (future registries)

Task 2 (PR #5036) ──── independent

Task 4 (platform header) ──► MCP v1.1.0 ship ──► Task 5 (update awesome-mcp entry)
```

**Order to tackle**: Task 1 (unblocks Task 3), then Task 4 (prerequisite for v1.1.0), then Task 3, then passive monitoring for Task 2 / Task 5 / Task 6.

---

## When things are done, update this file

Replace the 🔴/🟡/🟢 with ✅ and add a "Completed" date. Keeps the manual-task log in one place for future contributors.
