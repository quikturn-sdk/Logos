/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["main"],
  repositoryUrl: "https://github.com/Quikturn-PowerPoint-Add-In/Logo-SDK.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};
