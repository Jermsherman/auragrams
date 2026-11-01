// MVP launch feature flags. Set to true to re-enable post-launch.
// Static booleans so the bundler tree-shakes disabled branches.
export const flags = {
  enableRawRecording: false,
  enableAuracle: false,
  enableStoryExport: false,
  enableInfluence: false,
  enableEditPalette: false,
  enableColorInfluence: false,
  // No billing. Pro only unlocks extra measurements. Flip this, or open a page with ?tier=pro.
  enableProInsights: false,
  // Off: the Read is the measured story and no model is called.
  // On: experimental path calls the Lovable AI gateway. Not part of Free.
  enableModelInsight: false,
} as const;
