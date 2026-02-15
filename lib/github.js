/**
 * GitHub integration helpers (e.g. gh CLI)
 * Used for triage issue count when gh is available.
 */

const { execSync } = require('child_process');

/**
 * Get count of open GitHub Issues with label "triage" in the current repo.
 * Requires GitHub CLI (gh) to be installed and authenticated.
 * @param {string} cwd - Working directory (repo root)
 * @returns {number|null} Count of issues, or null if unavailable (gh missing, not auth, etc.)
 */
function getTriageIssueCount(cwd = process.cwd()) {
  try {
    const out = execSync('gh issue list --label triage --state open --json number', {
      encoding: 'utf8',
      timeout: 8000,
      cwd
    });
    const list = JSON.parse(out || '[]');
    return Array.isArray(list) ? list.length : 0;
  } catch (_) {
    return null;
  }
}

module.exports = { getTriageIssueCount };
