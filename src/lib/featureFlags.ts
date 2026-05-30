// MVP launch feature flags. Set to true to re-enable post-launch.
// Static booleans so the bundler tree-shakes disabled branches.
export const flags = {
  enableRawRecording: false,
  enableAuracle: false,
  enableStoryExport: false,
  enableInfluence: false,
  enableEditPalette: false,
  enableColorInfluence: false,
} as const;
