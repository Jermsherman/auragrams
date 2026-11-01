/** The artist answers this. It is not a detection. */
export type ArtistVocals = boolean | null;

export function artistVocalValue(hasVocals: boolean | null | undefined): string {
  if (hasVocals === true) return "Yes";
  if (hasVocals === false) return "No";
  return "Not sure";
}

export function artistVocalHint(hasVocals: boolean | null | undefined): string {
  if (hasVocals === true || hasVocals === false) return "artist-reported";
  return "artist hasn't answered";
}
