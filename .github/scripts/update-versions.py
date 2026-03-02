#!/usr/bin/env python3
"""
Version tracking automation script.

Runs on push to main to:
  1. Detect which agent directories changed in the triggering commits.
  2. Determine the semver bump type (major/minor/patch) from conventional commit messages.
  3. Update the version field in solution-definition.yaml for changed agents.
  4. Prepend a new section to the agent's CHANGELOG.md.
  5. Refresh the root version-manifest.json.

Conventional commit prefixes:
  BREAKING CHANGE / feat!  -> major bump
  feat                     -> minor bump
  fix / perf / refactor /
  docs / style / test /
  chore / build / ci       -> patch bump
"""

import json
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "version-manifest.json"
VERTICALS = ["clothing", "coffee", "insurance", "tech", "transportation"]
TODAY = date.today().isoformat()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run(cmd, **kwargs):
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    return result.stdout.strip()


def normalize_version(raw):
    """
    Normalise a version string to strict semver (3 parts).
    Accepts '1.0.0', '1.0.0.0', '1.0.0.1', etc.
    """
    parts = str(raw).strip().strip('"').split(".")
    major = int(parts[0]) if len(parts) > 0 else 0
    minor = int(parts[1]) if len(parts) > 1 else 0
    patch = int(parts[2]) if len(parts) > 2 else 0
    # If a 4th build segment is non-zero, roll it into patch
    build = int(parts[3]) if len(parts) > 3 else 0
    patch += build
    return f"{major}.{minor}.{patch}"


def bump_version(version, bump_type):
    """Apply a semver bump. bump_type: 'major' | 'minor' | 'patch'."""
    major, minor, patch = map(int, version.split("."))
    if bump_type == "major":
        return f"{major + 1}.0.0"
    if bump_type == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def detect_bump_type(messages):
    """
    Inspect a list of commit message strings and return the highest bump type.
    """
    bump = "patch"
    for msg in messages:
        msg_lower = msg.lower()
        if "breaking change" in msg_lower or re.search(r"^[a-z]+!:", msg_lower):
            return "major"
        if re.match(r"^feat(\(.*\))?:", msg_lower):
            bump = "minor"
    return bump


def get_changed_agent_dirs(commit_range):
    """
    Return a set of agent directory paths (relative to REPO_ROOT) that contain
    at least one changed file in the given commit range.
    """
    output = run(["git", "diff", "--name-only", commit_range], cwd=REPO_ROOT)
    changed_agents = set()
    for line in output.splitlines():
        parts = Path(line).parts
        # Pattern: <vertical>/agents/<agent-name>/...
        if len(parts) >= 3 and parts[0] in VERTICALS and parts[1] == "agents":
            agent_dir = "/".join(parts[:3])
            changed_agents.add(agent_dir)
    return changed_agents


def get_commit_messages(commit_range):
    """Return list of commit subject lines for the given range."""
    output = run(
        ["git", "log", "--format=%s", commit_range],
        cwd=REPO_ROOT,
    )
    return [line for line in output.splitlines() if line.strip()]


def read_manifest():
    with open(MANIFEST_PATH) as fh:
        return json.load(fh)


def write_manifest(data):
    with open(MANIFEST_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def read_solution_version(agent_dir):
    """
    Read the version field from solution-definition.yaml.
    Returns a normalized semver string, or None if the file does not exist.
    """
    sol_path = REPO_ROOT / agent_dir / "solution" / "solution-definition.yaml"
    if not sol_path.exists():
        return None
    content = sol_path.read_text()
    match = re.search(r'^\s+version:\s+"?([^"\n]+)"?\s*$', content, re.MULTILINE)
    if match:
        return normalize_version(match.group(1))
    return None


def write_solution_version(agent_dir, new_version):
    """
    Update the version field in solution-definition.yaml (in-place).
    Only rewrites the first occurrence under the 'solution:' block.
    """
    sol_path = REPO_ROOT / agent_dir / "solution" / "solution-definition.yaml"
    if not sol_path.exists():
        return
    content = sol_path.read_text()
    updated = re.sub(
        r'(^\s+version:\s+)"?[^"\n]+"?',
        lambda m: f'{m.group(1)}"{new_version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    sol_path.write_text(updated)


def update_changelog(agent_dir, new_version, messages, bump_type):
    """
    Prepend a new version section to the agent's CHANGELOG.md.
    Creates the file with a header if it does not yet exist.
    """
    changelog_path = REPO_ROOT / agent_dir / "CHANGELOG.md"
    agent_name = Path(agent_dir).name

    section_lines = [f"## [{new_version}] - {TODAY}", ""]
    if bump_type == "major":
        section_lines.append("### Changed (Breaking)")
    elif bump_type == "minor":
        section_lines.append("### Added")
    else:
        section_lines.append("### Fixed")
    section_lines.append("")
    for msg in messages:
        section_lines.append(f"- {msg}")
    section_lines.append("")

    new_section = "\n".join(section_lines) + "\n"

    if changelog_path.exists():
        existing = changelog_path.read_text()
        # Insert after the header block (lines starting with # or blank) before first ##
        if "## [" in existing:
            updated = existing.replace(
                existing[existing.index("## ["):],
                new_section + existing[existing.index("## ["):],
                1,
            )
        else:
            updated = existing.rstrip("\n") + "\n\n" + new_section
        changelog_path.write_text(updated)
    else:
        header = (
            f"# Changelog\n\n"
            f"All notable changes to the {agent_name} agent will be documented in this file.\n\n"
            f"Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n"
            f"Versioning follows [Semantic Versioning](https://semver.org/).\n\n"
        )
        changelog_path.write_text(header + new_section)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Determine the commit range. GitHub Actions sets GITHUB_SHA; the
    # previous commit is its parent.
    before_sha = os.environ.get("BEFORE_SHA", "HEAD^")
    after_sha = os.environ.get("AFTER_SHA", "HEAD")

    # Skip the merge commit itself if it is the only change, and inspect the
    # range of commits included in the push.
    commit_range = f"{before_sha}..{after_sha}"

    print(f"Inspecting commit range: {commit_range}")

    changed_agents = get_changed_agent_dirs(commit_range)
    if not changed_agents:
        print("No agent directories changed. Nothing to update.")
        return

    messages = get_commit_messages(commit_range)
    bump_type = detect_bump_type(messages)
    print(f"Detected bump type: {bump_type}")
    print(f"Changed agents: {sorted(changed_agents)}")

    manifest = read_manifest()
    manifest["lastUpdated"] = TODAY

    for agent_dir in sorted(changed_agents):
        # Skip the script's own directory and any non-agent paths
        if not (REPO_ROOT / agent_dir).is_dir():
            continue

        current_version = read_solution_version(agent_dir)
        if current_version is None:
            # Fall back to manifest version or default
            entry = manifest["agents"].get(agent_dir, {})
            current_version = entry.get("version", "1.0.0")

        new_version = bump_version(current_version, bump_type)
        print(f"  {agent_dir}: {current_version} -> {new_version}")

        write_solution_version(agent_dir, new_version)
        update_changelog(agent_dir, new_version, messages, bump_type)

        manifest["agents"].setdefault(agent_dir, {
            "version": new_version,
            "lastUpdated": TODAY,
            "status": "production",
        })
        manifest["agents"][agent_dir]["version"] = new_version
        manifest["agents"][agent_dir]["lastUpdated"] = TODAY

    write_manifest(manifest)
    print("Version manifest updated.")


if __name__ == "__main__":
    main()
