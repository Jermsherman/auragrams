// Aura Engine v3 — mood + music-theory + RGB palette + poetic descriptions.
// Pure functions, no side effects. Backward compatible with v2 imports.

// ----------------- base personality (12 mood archetypes) -----------------
export type MoodKey =
  | "warm" | "nostalgic" | "dreamy" | "euphoric" | "romantic" | "melancholy"
  | "dark" | "cinematic" | "coastal" | "intimate" | "mysterious" | "energetic";

export type PaletteKey = MoodKey;

export type ShapeKind = "round" | "oval" | "soft-blob" | "tall" | "wide";
export type MotionKind = "breathe" | "pulse" | "tide" | "shimmer" | "drift" | "smoke";
export type TextureKind = "smooth" | "grain" | "silk" | "mist" | "smoke" | "ripple";
export type ParticleKind = "dust" | "smoke" | "shimmer" | "mist" | "embers" | "tide";

export type AuraPersonality = {
  key: MoodKey;
  label: string;
  stops: [string, string, string, string, string]; // OKLCH or hex; CSS works either way
  swatches: string[];
  glow: string;
  atmosphere: string;
  shape: ShapeKind;
  motion: MotionKind;
  texture: TextureKind;
  particle: ParticleKind;
  particleCount: number;
  speed: number;
  hueShift: number;
  phrases: { tone: string[]; color: string[]; edge: string[]; motion: string[] };
};

// Compact base personality table — drives the orb's silhouette/motion archetypes.
const BASE: Record<MoodKey, Omit<AuraPersonality, "label" | "key">> = {
  warm: {
    stops: ["oklch(0.84 0.14 70)","oklch(0.78 0.16 40)","oklch(0.72 0.2 10)","oklch(0.6 0.2 310)","oklch(0.84 0.14 70)"],
    swatches: ["#F4C58A","#F4A271","#E96D78","#A86BC8"],
    glow: "oklch(0.78 0.18 30 / 0.6)", atmosphere: "oklch(0.5 0.18 25 / 0.35)",
    shape: "round", motion: "breathe", texture: "grain", particle: "dust",
    particleCount: 14, speed: 0.8, hueShift: 0,
    phrases: { tone:["warm","sun-soaked","amber"], color:["sunset tones","peach and rose","honeyed pink light"], edge:["glowing edges","a soft amber halo","burnished light"], motion:["a slow breathing pulse","gentle ripples","lazy summer drift"] },
  },
  nostalgic: {
    stops:["oklch(0.78 0.12 30)","oklch(0.7 0.16 40)","oklch(0.6 0.18 350)","oklch(0.5 0.16 305)","oklch(0.78 0.12 30)"],
    swatches:["#E9B89A","#E08A86","#A06B8E","#5B4373"],
    glow:"oklch(0.65 0.18 20 / 0.5)", atmosphere:"oklch(0.4 0.14 20 / 0.3)",
    shape:"oval", motion:"drift", texture:"grain", particle:"dust",
    particleCount:12, speed:0.6, hueShift:-8,
    phrases:{ tone:["nostalgic","faded","wistful"], color:["dusty peach and plum","sepia-tinted rose","old-photograph warmth"], edge:["a soft grainy halo","faded edges","a quiet golden rim"], motion:["a slow drift","memory-like floating","barely-moving warmth"] },
  },
  dreamy: {
    stops:["oklch(0.92 0.04 270)","oklch(0.84 0.1 285)","oklch(0.78 0.12 250)","oklch(0.82 0.1 200)","oklch(0.92 0.04 270)"],
    swatches:["#E5DEF7","#C4B5F0","#9DB6E8","#A9D6E5"],
    glow:"oklch(0.85 0.1 270 / 0.55)", atmosphere:"oklch(0.55 0.12 270 / 0.3)",
    shape:"soft-blob", motion:"shimmer", texture:"mist", particle:"shimmer",
    particleCount:22, speed:1.0, hueShift:20,
    phrases:{ tone:["weightless","ethereal","floating"], color:["lavender and cyan light","pale violet shimmer","cloud-soft pastels"], edge:["a shimmering veil","an airy blurred halo","a soft glassy rim"], motion:["airy floating drift","weightless shimmer","an upward gentle lift"] },
  },
  euphoric: {
    stops:["oklch(0.85 0.16 100)","oklch(0.82 0.18 200)","oklch(0.78 0.2 320)","oklch(0.75 0.2 250)","oklch(0.94 0.06 300)"],
    swatches:["#F8E16C","#3FD0C9","#FF4FCB","#7C8AFF"],
    glow:"oklch(0.82 0.2 220 / 0.65)", atmosphere:"oklch(0.6 0.2 320 / 0.35)",
    shape:"round", motion:"pulse", texture:"smooth", particle:"shimmer",
    particleCount:26, speed:1.5, hueShift:30,
    phrases:{ tone:["euphoric","exhilarated","luminous"], color:["electric magenta and cyan","rising prismatic light","bright neon bloom"], edge:["a radiant burst","a glowing aura","blinding edges"], motion:["a fast pulsing bloom","rising rhythmic surges","high-energy bursts"] },
  },
  romantic: {
    stops:["oklch(0.84 0.1 40)","oklch(0.78 0.14 20)","oklch(0.7 0.18 0)","oklch(0.55 0.18 340)","oklch(0.84 0.1 40)"],
    swatches:["#F4C2A1","#E48498","#B65478","#693060"],
    glow:"oklch(0.7 0.18 5 / 0.55)", atmosphere:"oklch(0.45 0.18 0 / 0.32)",
    shape:"oval", motion:"breathe", texture:"silk", particle:"dust",
    particleCount:14, speed:0.7, hueShift:-4,
    phrases:{ tone:["romantic","tender","intimate"], color:["rose, plum and amber","silken pinks","warm candlelit hues"], edge:["a soft haze","silken glowing edges","a velvet-lit halo"], motion:["silky waves","a slow heartbeat","warm rolling breath"] },
  },
  melancholy: {
    stops:["oklch(0.62 0.14 250)","oklch(0.5 0.16 270)","oklch(0.4 0.16 305)","oklch(0.55 0.16 220)","oklch(0.62 0.14 250)"],
    swatches:["#7C8AB8","#5C5E94","#3F3461","#4D7290"],
    glow:"oklch(0.5 0.16 280 / 0.5)", atmosphere:"oklch(0.3 0.12 270 / 0.35)",
    shape:"tall", motion:"drift", texture:"mist", particle:"mist",
    particleCount:10, speed:0.5, hueShift:-15,
    phrases:{ tone:["melancholy","quiet","blue-hour"], color:["deep blue and faded violet","rain-lit indigo","muted twilight"], edge:["a dim foggy halo","softened edges","a weary glow"], motion:["a slow downward drift","barely-moving stillness","a long sigh"] },
  },
  dark: {
    stops:["oklch(0.18 0.05 290)","oklch(0.32 0.16 295)","oklch(0.42 0.18 260)","oklch(0.5 0.22 25)","oklch(0.18 0.05 290)"],
    swatches:["#1B1230","#3A1F4E","#4C3470","#8C1E3F"],
    glow:"oklch(0.42 0.2 295 / 0.6)", atmosphere:"oklch(0.18 0.08 290 / 0.5)",
    shape:"round", motion:"smoke", texture:"smoke", particle:"smoke",
    particleCount:18, speed:0.7, hueShift:-12,
    phrases:{ tone:["deep","shadowed","midnight"], color:["indigo and crimson shadow","near-black with violet undertone","obsidian glow"], edge:["a smoldering halo","a heavy dark rim","a smoky crown"], motion:["a heavy pulse","slow smoky churn","low cinematic surge"] },
  },
  cinematic: {
    stops:["oklch(0.6 0.18 40)","oklch(0.55 0.22 25)","oklch(0.45 0.2 320)","oklch(0.3 0.12 290)","oklch(0.6 0.18 40)"],
    swatches:["#C57E4A","#B83A3A","#71336A","#2B1F3D"],
    glow:"oklch(0.55 0.22 20 / 0.6)", atmosphere:"oklch(0.28 0.16 295 / 0.4)",
    shape:"wide", motion:"pulse", texture:"smoke", particle:"embers",
    particleCount:18, speed:1.1, hueShift:-6,
    phrases:{ tone:["cinematic","epic","wide-screen"], color:["crimson and indigo","scorched orange against deep violet","filmic shadow and flame"], edge:["a smoldering halo","an atmospheric rim of embers","a widescreen glow"], motion:["heavy cinematic surges","a slow building pulse","tidal swells of light"] },
  },
  coastal: {
    stops:["oklch(0.86 0.08 220)","oklch(0.78 0.12 200)","oklch(0.7 0.14 240)","oklch(0.78 0.14 25)","oklch(0.86 0.08 220)"],
    swatches:["#A9DCE6","#5FB6C7","#5A86B8","#E8927C"],
    glow:"oklch(0.78 0.14 215 / 0.55)", atmosphere:"oklch(0.5 0.14 220 / 0.35)",
    shape:"wide", motion:"tide", texture:"ripple", particle:"tide",
    particleCount:16, speed:0.8, hueShift:60,
    phrases:{ tone:["coastal","open","salt-air"], color:["teal, ocean blue and coral","lavender dusk on water","horizon-line pastels"], edge:["a breezy halo","a sea-mist rim","edges that breathe like surf"], motion:["slow tidal motion","lapping waves","a gentle ocean sway"] },
  },
  intimate: {
    stops:["oklch(0.7 0.14 40)","oklch(0.62 0.16 10)","oklch(0.5 0.18 0)","oklch(0.4 0.14 320)","oklch(0.7 0.14 40)"],
    swatches:["#D29A6C","#B96264","#7E2F4D","#532A55"],
    glow:"oklch(0.55 0.18 10 / 0.55)", atmosphere:"oklch(0.35 0.16 0 / 0.4)",
    shape:"soft-blob", motion:"breathe", texture:"silk", particle:"embers",
    particleCount:10, speed:0.55, hueShift:-2,
    phrases:{ tone:["intimate","close","candlelit"], color:["plum, rose and amber ember","warm low light","wine-dark warmth"], edge:["a soft haze","a quiet glowing rim","edges lit from within"], motion:["a close, slow heartbeat","barely-there breathing","a hushed pulse"] },
  },
  mysterious: {
    stops:["oklch(0.25 0.1 280)","oklch(0.4 0.18 310)","oklch(0.45 0.18 200)","oklch(0.55 0.16 160)","oklch(0.25 0.1 280)"],
    swatches:["#231742","#5C2D75","#2D6B85","#3B8C6E"],
    glow:"oklch(0.45 0.18 260 / 0.55)", atmosphere:"oklch(0.22 0.12 280 / 0.4)",
    shape:"tall", motion:"smoke", texture:"mist", particle:"mist",
    particleCount:14, speed:0.6, hueShift:40,
    phrases:{ tone:["mysterious","veiled","occult"], color:["jade and violet shadow","deep teal with magenta veins","nocturnal blues"], edge:["a veiled halo","a shifting smoky rim","a hidden glow"], motion:["a slow turning churn","veiled drifting","an unsettled sway"] },
  },
  energetic: {
    stops:["oklch(0.82 0.18 60)","oklch(0.78 0.2 30)","oklch(0.72 0.22 350)","oklch(0.8 0.18 110)","oklch(0.82 0.18 60)"],
    swatches:["#F6A93B","#F25C3C","#FF3DA1","#A8E04F"],
    glow:"oklch(0.8 0.2 50 / 0.65)", atmosphere:"oklch(0.55 0.2 40 / 0.35)",
    shape:"round", motion:"pulse", texture:"grain", particle:"shimmer",
    particleCount:26, speed:1.6, hueShift:10,
    phrases:{ tone:["energetic","kinetic","live-wire"], color:["citrus and magenta","hot orange and electric pink","high-voltage warmth"], edge:["a crackling halo","edges that flare with the beat","a sharp bright rim"], motion:["fast rhythmic pulses","kinetic bursts","a relentless heartbeat"] },
  },
};

export const PERSONALITIES: Record<MoodKey, AuraPersonality> = Object.fromEntries(
  Object.entries(BASE).map(([k, v]) => [k, { key: k as MoodKey, label: cap(k), ...v }]),
) as Record<MoodKey, AuraPersonality>;

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }

// ----------------- 54-mood extended traits -----------------
export type MoodTrait = {
  base: MoodKey;
  colors: string[]; // hex 3–4
  motion: MotionKind;
  texture: TextureKind;
  particle: ParticleKind;
  speed: number;       // motion multiplier
  energyBias: number;  // -15..+15
  motionWords: string[]; // short keywords
  vibe: string[];      // poetic phrases for descriptions
};

export const MOOD_TRAITS: Record<string, MoodTrait> = {
  Warm:{base:"warm",colors:["#F4C58A","#F4A271","#E96D78","#FFD9A0"],motion:"breathe",texture:"grain",particle:"dust",speed:0.8,energyBias:2,motionWords:["bloom","breath","glow"],vibe:["a slow amber bloom","sun-warmed haze"]},
  Nostalgic:{base:"nostalgic",colors:["#E9B89A","#E08A86","#A06B8E","#F2C9B0"],motion:"drift",texture:"grain",particle:"dust",speed:0.6,energyBias:-4,motionWords:["drift","memory","haze"],vibe:["a sepia-lit memory","a slow drift through old summers"]},
  Dreamy:{base:"dreamy",colors:["#E5DEF7","#C4B5F0","#9DB6E8","#FBF5FF"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:1.0,energyBias:-2,motionWords:["float","shimmer","mist"],vibe:["a weightless lavender shimmer","cloud-soft drifting"]},
  Euphoric:{base:"euphoric",colors:["#3FD0C9","#FF4FCB","#F8E16C","#FFFFFF"],motion:"pulse",texture:"smooth",particle:"shimmer",speed:1.5,energyBias:14,motionWords:["bloom","burst","rise"],vibe:["a prismatic burst","light cracking the sky"]},
  Romantic:{base:"romantic",colors:["#F4C2A1","#E48498","#B65478","#7E2F4D"],motion:"breathe",texture:"silk",particle:"dust",speed:0.7,energyBias:0,motionWords:["silk","pulse","glow"],vibe:["candle-warm rose drift","a velvet hush"]},
  Melancholy:{base:"melancholy",colors:["#5C5E94","#3F3461","#7C8AB8","#7E97A8"],motion:"drift",texture:"mist",particle:"mist",speed:0.5,energyBias:-10,motionWords:["sigh","drift","fade"],vibe:["rain-lit indigo","a long blue sigh"]},
  Dark:{base:"dark",colors:["#1B1230","#3A1F4E","#8C1E3F","#0E0A1A"],motion:"smoke",texture:"smoke",particle:"smoke",speed:0.7,energyBias:4,motionWords:["pull","smolder","shadow"],vibe:["obsidian glow","a brooding crimson shadow"]},
  Cinematic:{base:"cinematic",colors:["#C57E4A","#B83A3A","#71336A","#2B1F3D"],motion:"pulse",texture:"smoke",particle:"embers",speed:1.1,energyBias:8,motionWords:["swell","ember","rise"],vibe:["a widescreen ember swell","filmic shadow and flame"]},
  Coastal:{base:"coastal",colors:["#A9DCE6","#5FB6C7","#5A86B8","#E8927C"],motion:"tide",texture:"ripple",particle:"tide",speed:0.8,energyBias:0,motionWords:["tide","ripple","drift"],vibe:["salt-air shimmer","slow tidal motion"]},
  Intimate:{base:"intimate",colors:["#D29A6C","#B96264","#7E2F4D","#3A1832"],motion:"breathe",texture:"silk",particle:"embers",speed:0.55,energyBias:-6,motionWords:["close","breath","ember"],vibe:["a candlelit hush","wine-dark closeness"]},
  Mysterious:{base:"mysterious",colors:["#231742","#5C2D75","#2D6B85","#3B8C6E"],motion:"smoke",texture:"mist",particle:"mist",speed:0.6,energyBias:-2,motionWords:["veil","churn","drift"],vibe:["a veiled jade shimmer","nocturnal smoke"]},
  Energetic:{base:"energetic",colors:["#F6A93B","#F25C3C","#FF3DA1","#A8E04F"],motion:"pulse",texture:"grain",particle:"shimmer",speed:1.6,energyBias:14,motionWords:["pulse","spark","flare"],vibe:["a crackling kinetic burst","high-voltage warmth"]},
  Heavenly:{base:"dreamy",colors:["#FFFFFF","#F8E27A","#C8E0FF","#D9C7F5"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:0.9,energyBias:2,motionWords:["ascend","halo","light"],vibe:["an upward angelic glow","gold-lit cloud"]},
  Lonely:{base:"melancholy",colors:["#283C5C","#A8B6CC","#4A5A78","#6B7A99"],motion:"drift",texture:"mist",particle:"mist",speed:0.45,energyBias:-12,motionWords:["distant","drift","hollow"],vibe:["a distant silver flicker","empty winter air"]},
  Spiritual:{base:"mysterious",colors:["#5B3494","#F1C75B","#FFFFFF","#1A2A6E"],motion:"breathe",texture:"silk",particle:"shimmer",speed:0.7,energyBias:0,motionWords:["halo","breath","circle"],vibe:["a sacred circling pulse","gold and violet light"]},
  Hopeful:{base:"coastal",colors:["#A9D8FF","#F4D67A","#B8E3B0","#FFFFFF"],motion:"breathe",texture:"smooth",particle:"shimmer",speed:0.95,energyBias:6,motionWords:["rise","bloom","clear"],vibe:["a clean rising bloom","sky-blue lift"]},
  Bittersweet:{base:"romantic",colors:["#B58FA6","#E2A682","#9B6B89","#5E3F5C"],motion:"drift",texture:"silk",particle:"dust",speed:0.65,energyBias:-4,motionWords:["push","pull","fade"],vibe:["a soft push-pull","mauve dusk haze"]},
  Tense:{base:"dark",colors:["#1A0B14","#B22B3A","#4D1E5C","#0E0E12"],motion:"pulse",texture:"grain",particle:"smoke",speed:1.3,energyBias:10,motionWords:["vibrate","tighten","spark"],vibe:["a tight electric vibration","static-lit shadow"]},
  Triumphant:{base:"cinematic",colors:["#F2C84B","#2A4FB5","#FFFFFF","#C57E4A"],motion:"pulse",texture:"smooth",particle:"shimmer",speed:1.2,energyBias:12,motionWords:["surge","bloom","flare"],vibe:["a rising royal surge","bright open flare"]},
  Playful:{base:"energetic",colors:["#FF8FC3","#5BD8E0","#FFE36E","#B57BFF"],motion:"shimmer",texture:"smooth",particle:"shimmer",speed:1.4,energyBias:8,motionWords:["bounce","sparkle","pop"],vibe:["candy-bright sparkle","a quick playful bounce"]},
  Seductive:{base:"intimate",colors:["#5C1E2E","#7E2F4D","#A55273","#2A0E1C"],motion:"smoke",texture:"silk",particle:"embers",speed:0.6,energyBias:-2,motionWords:["swirl","velvet","pulse"],vibe:["a slow velvet swirl","wine-lit shadow"]},
  Reflective:{base:"melancholy",colors:["#7E97A8","#7A8AA6","#C5D2DA","#52647A"],motion:"drift",texture:"ripple",particle:"mist",speed:0.5,energyBias:-6,motionWords:["mirror","ripple","drift"],vibe:["a glassy mirror ripple","slow inward drift"]},
  Raw:{base:"cinematic",colors:["#A14A2A","#C0392B","#3D2A26","#E37A4A"],motion:"pulse",texture:"grain",particle:"embers",speed:1.0,energyBias:6,motionWords:["uneven","grit","glow"],vibe:["a rough uneven pulse","scorched orange grain"]},
  Hazy:{base:"dreamy",colors:["#C7BBD2","#F0C7D4","#A6B8C8","#E5DCE3"],motion:"drift",texture:"mist",particle:"mist",speed:0.7,energyBias:-4,motionWords:["blur","drift","fog"],vibe:["a blurred lavender fog","soft pink haze"]},
  Weightless:{base:"dreamy",colors:["#FFFFFF","#A9E5F2","#D6C8FF","#EFFBFF"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:0.9,energyBias:2,motionWords:["float","expand","lift"],vibe:["a floating expansion","air-glow shimmer"]},
  Brooding:{base:"dark",colors:["#241F2E","#3D2348","#6B1F2A","#0F0D14"],motion:"smoke",texture:"smoke",particle:"smoke",speed:0.55,energyBias:0,motionWords:["heavy","low","churn"],vibe:["a low heavy pulse","charcoal violet smolder"]},
  Glowing:{base:"warm",colors:["#FFD86E","#FF9DAE","#FFB97A","#FFE7B3"],motion:"breathe",texture:"smooth",particle:"shimmer",speed:1.0,energyBias:4,motionWords:["bloom","radiate","breath"],vibe:["a radiant breathing bloom","peach gold glow"]},
  Restless:{base:"energetic",colors:["#3DA9FF","#FF6B3D","#9D5BFF","#1B1E2D"],motion:"pulse",texture:"grain",particle:"shimmer",speed:1.4,energyBias:8,motionWords:["jitter","ripple","spark"],vibe:["a jittered electric ripple","static-spark unease"]},
  Blissful:{base:"euphoric",colors:["#FFE3A3","#A9E5F2","#FFB6D5","#FFFFFF"],motion:"breathe",texture:"smooth",particle:"shimmer",speed:1.0,energyBias:6,motionWords:["bloom","upward","glow"],vibe:["a smooth upward bloom","light haze of joy"]},
  Midnight:{base:"mysterious",colors:["#0E1638","#3D2A75","#9C9BC2","#0A0815"],motion:"drift",texture:"mist",particle:"mist",speed:0.55,energyBias:-6,motionWords:["nocturnal","slow","silver"],vibe:["a slow nocturnal pulse","silver in deep blue"]},
  Summer:{base:"warm",colors:["#FF8E72","#F8C447","#5BD2D2","#FFB58A"],motion:"tide",texture:"smooth",particle:"shimmer",speed:1.0,energyBias:6,motionWords:["wave","sun","bloom"],vibe:["a warm sun-haze wave","coral and gold air"]},
  Winter:{base:"coastal",colors:["#A8D6F2","#D6E2EC","#FFFFFF","#1F2D4F"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:0.8,energyBias:-4,motionWords:["frost","crisp","still"],vibe:["a crisp frost shimmer","silver winter air"]},
  Golden:{base:"warm",colors:["#F1C75B","#E89B4A","#FFE3B0","#C57E4A"],motion:"breathe",texture:"smooth",particle:"shimmer",speed:0.9,energyBias:4,motionWords:["bloom","sun","warm"],vibe:["a warm gold bloom","sunlight on skin"]},
  Electric:{base:"energetic",colors:["#3DD2FF","#9C2BFF","#FF3DA1","#0E0E1A"],motion:"shimmer",texture:"smooth",particle:"shimmer",speed:1.6,energyBias:12,motionWords:["arc","spark","flash"],vibe:["a fast plasma arc","ultraviolet flicker"]},
  Oceanic:{base:"coastal",colors:["#1F8A9A","#2D5FAE","#7AD0C8","#0E2A3A"],motion:"tide",texture:"ripple",particle:"tide",speed:0.7,energyBias:0,motionWords:["tide","current","drift"],vibe:["a deep circular current","liquid-glass tide"]},
  Fragile:{base:"dreamy",colors:["#F5D6E0","#D8D8E5","#E5C8F0","#FFFFFF"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:0.6,energyBias:-6,motionWords:["flicker","thin","glass"],vibe:["a delicate glass flicker","pale silvered breath"]},
  Velvet:{base:"intimate",colors:["#5E2A6A","#7E2F4D","#3D2348","#C57E4A"],motion:"breathe",texture:"silk",particle:"embers",speed:0.55,energyBias:-2,motionWords:["fold","silk","slow"],vibe:["a slow velvet fold","royal violet hush"]},
  Chaotic:{base:"energetic",colors:["#FF3D3D","#3DD2FF","#9C2BFF","#FF8E2C"],motion:"pulse",texture:"grain",particle:"shimmer",speed:1.6,energyBias:10,motionWords:["burst","disorder","ripple"],vibe:["controlled disorder","sparks across violet air"]},
  Gentle:{base:"warm",colors:["#FFEFD6","#C8E5C4","#BFD6E8","#F5C8B0"],motion:"breathe",texture:"smooth",particle:"dust",speed:0.6,energyBias:-2,motionWords:["soft","breath","still"],vibe:["a soft cream breath","quiet pastoral haze"]},
  Transcendent:{base:"dreamy",colors:["#FFFFFF","#9C2BFF","#F1C75B","#3DD2FF"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:1.0,energyBias:6,motionWords:["expand","halo","cosmic"],vibe:["an expanding cosmic halo","white-gold transcendence"]},
  Soulful:{base:"intimate",colors:["#C57E4A","#7E2F4D","#5E2A6A","#F1C75B"],motion:"breathe",texture:"silk",particle:"embers",speed:0.7,energyBias:0,motionWords:["sway","warm","analog"],vibe:["a deep analog sway","amber and burgundy warmth"]},
  Anxious:{base:"dark",colors:["#A8C04A","#B22B3A","#1B1E2D","#E0D34A"],motion:"pulse",texture:"grain",particle:"smoke",speed:1.3,energyBias:8,motionWords:["flicker","tight","static"],vibe:["a tight flickering pulse","static-lit unease"]},
  Uplifting:{base:"euphoric",colors:["#A9D8FF","#F4D67A","#FF8FA3","#FFFFFF"],motion:"breathe",texture:"smooth",particle:"shimmer",speed:1.1,energyBias:10,motionWords:["rise","bloom","clear"],vibe:["a rising sky bloom","bright open air"]},
  Haunted:{base:"mysterious",colors:["#7AAEB0","#564E6E","#D8E0DC","#0E1018"],motion:"smoke",texture:"mist",particle:"mist",speed:0.5,energyBias:-8,motionWords:["pull","fade","echo"],vibe:["a slow spectral pull","ghost-blue echo"]},
  Tender:{base:"romantic",colors:["#F8C8D6","#F4E0C8","#D9C7F0","#FFE5C2"],motion:"breathe",texture:"silk",particle:"dust",speed:0.6,energyBias:-2,motionWords:["soft","pulse","glow"],vibe:["a delicate candlelit pulse","blush and cream"]},
  Radiant:{base:"euphoric",colors:["#FFFFFF","#F1C75B","#FF3DA1","#3DD2FF"],motion:"pulse",texture:"smooth",particle:"shimmer",speed:1.3,energyBias:10,motionWords:["flare","bloom","bright"],vibe:["a bright expansion","white-gold flare"]},
  Stormy:{base:"cinematic",colors:["#3F4E78","#5A4A8A","#D6D6E5","#1F2A4A"],motion:"smoke",texture:"smoke",particle:"smoke",speed:1.0,energyBias:4,motionWords:["roll","swell","silver"],vibe:["a rolling slate swell","silver inside cloud"]},
  Serene:{base:"coastal",colors:["#BFD6E8","#C8E5C4","#FFFFFF","#D9C7F0"],motion:"tide",texture:"ripple",particle:"tide",speed:0.55,energyBias:-4,motionWords:["calm","ripple","still"],vibe:["a still water ripple","quiet pale air"]},
  Gritty:{base:"cinematic",colors:["#8B3E1A","#3D2A26","#A6262E","#C9A24A"],motion:"pulse",texture:"grain",particle:"embers",speed:0.9,energyBias:4,motionWords:["rough","grit","glow"],vibe:["a rough rust pulse","dirty gold edges"]},
  Hypnotic:{base:"mysterious",colors:["#5E2A6A","#1F8A9A","#FF3DA1","#0E0815"],motion:"shimmer",texture:"silk",particle:"shimmer",speed:0.9,energyBias:2,motionWords:["spiral","loop","pull"],vibe:["a looping liquid spiral","violet-teal pull"]},
  Wistful:{base:"nostalgic",colors:["#A6B8C8","#F0C7D4","#E2A682","#7E97A8"],motion:"drift",texture:"grain",particle:"dust",speed:0.5,energyBias:-6,motionWords:["backward","drift","ache"],vibe:["a backward memory drift","dusty rose ache"]},
  Ethereal:{base:"dreamy",colors:["#F0E8FF","#C8E5F2","#FFFFFF","#D6C8FF"],motion:"shimmer",texture:"mist",particle:"shimmer",speed:0.8,energyBias:0,motionWords:["float","mist","pearl"],vibe:["a pearled floating mist","cyan-lavender breath"]},
  Passionate:{base:"intimate",colors:["#C0392B","#FF3DA1","#FF8E2C","#5E2A6A"],motion:"pulse",texture:"silk",particle:"embers",speed:1.2,energyBias:8,motionWords:["flame","pulse","heat"],vibe:["a strong flame pulse","heat-glow crimson"]},
  Nocturnal:{base:"mysterious",colors:["#0E1638","#5B3494","#9C2BFF","#A8B6CC"],motion:"drift",texture:"mist",particle:"mist",speed:0.6,energyBias:-4,motionWords:["nocturnal","slow","silver"],vibe:["a moonlit nocturnal drift","neon-violet hush"]},
};




// ----------------- mood list + key map -----------------
export const MOODS = Object.keys(MOOD_TRAITS) as readonly string[];
export type Mood = string;

const MOOD_LABEL_TO_KEY: Record<string, MoodKey> = Object.fromEntries(
  Object.entries(MOOD_TRAITS).map(([label, t]) => [label, t.base]),
);
// legacy
MOOD_LABEL_TO_KEY["Chill"] = "coastal";
MOOD_LABEL_TO_KEY["Night Drive"] = "cinematic";

const LEGACY_PALETTE_TO_MOOD: Record<string, MoodKey> = {
  "warm-nostalgic":"warm","dark-cinematic":"cinematic","bright-euphoric":"euphoric",
  "coastal-dreamy":"coastal","melancholy-romantic":"romantic",
};

export function getPersonality(key: string | undefined | null): AuraPersonality {
  if (key && key in PERSONALITIES) return PERSONALITIES[key as MoodKey];
  if (key && key in LEGACY_PALETTE_TO_MOOD) return PERSONALITIES[LEGACY_PALETTE_TO_MOOD[key]];
  return PERSONALITIES.warm;
}

export const PALETTES: Record<string, AuraPersonality> = new Proxy(
  PERSONALITIES as unknown as Record<string, AuraPersonality>,
  { get(t, p: string) { if (p in t) return t[p]; if (p in LEGACY_PALETTE_TO_MOOD) return t[LEGACY_PALETTE_TO_MOOD[p]]; return t.warm; } },
);

export function personalityFromMoods(moods: string[]): MoodKey {
  for (const m of moods) { const k = MOOD_LABEL_TO_KEY[m]; if (k) return k; }
  return "warm";
}
export const paletteFromMoods = personalityFromMoods;

// ----------------- key profiles (music theory -> color/emotion) -----------------
export type KeyProfile = {
  tonic: string; mode: "major" | "minor";
  emotional: string[]; // bias keywords
  colors: string[];    // hex
};

const KEY_PROFILES: Record<string, KeyProfile> = {
  "C major": { tonic:"C", mode:"major", emotional:["clear","open","pure","grounded"], colors:["#F8F4E8","#F1D788","#A9D8FF"] },
  "G major": { tonic:"G", mode:"major", emotional:["hopeful","bright","airy","uplifting"], colors:["#F4D67A","#A9D8FF","#B8E3B0"] },
  "D major": { tonic:"D", mode:"major", emotional:["triumphant","vivid","confident"], colors:["#3DA9FF","#F1C75B","#3DD2FF"] },
  "A major": { tonic:"A", mode:"major", emotional:["radiant","warm","glowing"], colors:["#F1C75B","#FFB58A","#FF8FA3"] },
  "E major": { tonic:"E", mode:"major", emotional:["electric","glossy","optimistic"], colors:["#3DD2FF","#FF3DA1","#9C2BFF"] },
  "B major": { tonic:"B", mode:"major", emotional:["crystalline","polished","futuristic"], colors:["#A9E5F2","#D6D6E5","#9C2BFF"] },
  "F# major":{ tonic:"F#",mode:"major", emotional:["celestial","dreamy","cosmic","weightless"], colors:["#D6C8FF","#A9E5F2","#FFFFFF"] },
  "Db major":{ tonic:"Db",mode:"major", emotional:["lush","romantic","velvet","moonlit"], colors:["#F4A8C0","#5E2A6A","#2A4FB5"] },
  "Ab major":{ tonic:"Ab",mode:"major", emotional:["luxurious","soulful","dusk"], colors:["#7E2F4D","#FFB58A","#5E2A6A"] },
  "Eb major":{ tonic:"Eb",mode:"major", emotional:["soulful","theatrical","expressive"], colors:["#FF3DA1","#C57E4A","#5E2A6A"] },
  "Bb major":{ tonic:"Bb",mode:"major", emotional:["nostalgic","comforting","sunset"], colors:["#FF8E72","#F8C447","#F4A8C0"] },
  "F major": { tonic:"F", mode:"major", emotional:["open-hearted","gentle","pastoral"], colors:["#C8E5C4","#FFEFD6","#F4D67A"] },

  "A minor": { tonic:"A", mode:"minor", emotional:["honest","intimate","raw","shadowed"], colors:["#3D2A26","#8B3E1A","#5E2A6A"] },
  "E minor": { tonic:"E", mode:"minor", emotional:["reflective","dusky","lonely","deep"], colors:["#1F8A9A","#0E1638","#5B3494"] },
  "B minor": { tonic:"B", mode:"minor", emotional:["lonely","silver","distant"], colors:["#0E1638","#A8B6CC","#9C9BC2"] },
  "F# minor":{ tonic:"F#",mode:"minor", emotional:["cinematic","tense","cool","searching"], colors:["#5E2A6A","#3F4E78","#9C2BFF"] },
  "C# minor":{ tonic:"C#",mode:"minor", emotional:["dark romance","longing","neon shadow"], colors:["#231742","#5E2A6A","#FF3DA1"] },
  "G# minor":{ tonic:"G#",mode:"minor", emotional:["mysterious","smoky","cosmic"], colors:["#0E0815","#231742","#FF3DA1"] },
  "Eb minor":{ tonic:"Eb",mode:"minor", emotional:["haunted","storm-lit","dramatic"], colors:["#3F4E78","#564E6E","#A8B6CC"] },
  "Bb minor":{ tonic:"Bb",mode:"minor", emotional:["melancholic","velvet","aching"], colors:["#5E2A6A","#3F3461","#7E2F4D"] },
  "F minor": { tonic:"F", mode:"minor", emotional:["dramatic","sorrowful","intense"], colors:["#5C1E2E","#7E2F4D","#1A0B14"] },
  "C minor": { tonic:"C", mode:"minor", emotional:["brooding","powerful","cinematic"], colors:["#241F2E","#6B1F2A","#0E1638"] },
  "G minor": { tonic:"G", mode:"minor", emotional:["bittersweet","longing","dusk"], colors:["#3F4E78","#9B6B89","#C57E4A"] },
  "D minor": { tonic:"D", mode:"minor", emotional:["aching","candlelit","emotional"], colors:["#C57E4A","#7E2F4D","#5C5E94"] },
};

const KEY_ALIASES: Record<string,string> = {
  "Gb major":"F# major","C# major":"Db major","G# major":"Ab major","D# major":"Eb major","A# major":"Bb major",
  "Gb minor":"F# minor","Db minor":"C# minor","Ab minor":"G# minor","D# minor":"Eb minor","A# minor":"Bb minor",
};

export function resolveKeyProfile(key?: string | null): KeyProfile | null {
  if (!key) return null;
  const norm = key.replace(/\s+/g, " ").trim();
  // accept "E min", "E Minor" etc
  const m = norm.match(/^([A-Ga-g][#b]?)\s*(major|minor|maj|min|m)$/i);
  let canonical = norm;
  if (m) {
    const tonic = m[1][0].toUpperCase() + m[1].slice(1).replace("B","b");
    const mode = /maj/i.test(m[2]) ? "major" : "minor";
    canonical = `${tonic} ${mode}`;
  }
  if (canonical in KEY_PROFILES) return KEY_PROFILES[canonical];
  if (canonical in KEY_ALIASES) return KEY_PROFILES[KEY_ALIASES[canonical]];
  return null;
}

// ----------------- hex utilities + palette generation -----------------
function hexToRgb(h: string): [number,number,number] {
  const s = h.replace("#","");
  const v = s.length === 3 ? s.split("").map(c => c+c).join("") : s;
  const n = parseInt(v, 16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
function rgbToHex(r:number,g:number,b:number):string {
  const c = (x:number)=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mixHex(a:string,b:string,t:number):string {
  const [ar,ag,ab]=hexToRgb(a),[br,bg,bb]=hexToRgb(b);
  return rgbToHex(ar+(br-ar)*t,ag+(bg-ag)*t,ab+(bb-ab)*t);
}
function lighten(h:string,t:number):string { return mixHex(h,"#FFFFFF",t); }
function darken(h:string,t:number):string { return mixHex(h,"#0A0814",t); }
function shiftHue(h:string,deg:number):string {
  const [r,g,b]=hexToRgb(h);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let hue=0,s=0,l=(max+min)/510;
  if (d){ s = l>0.5? d/(510-max-min) : d/(max+min);
    hue = max===r?((g-b)/d+(g<b?6:0)) : max===g?((b-r)/d+2):((r-g)/d+4);
    hue*=60;
  }
  hue=(hue+deg+360)%360;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs(((hue/60)%2)-1)), m=l-c/2;
  let rp=0,gp=0,bp=0;
  if (hue<60){rp=c;gp=x;} else if (hue<120){rp=x;gp=c;} else if (hue<180){gp=c;bp=x;}
  else if (hue<240){gp=x;bp=c;} else if (hue<300){rp=x;bp=c;} else {rp=c;bp=x;}
  return rgbToHex((rp+m)*255,(gp+m)*255,(bp+m)*255);
}

export type AuraPalette = {
  primary: string; secondary: string; accent: string;
  shadow: string; glow: string; particle: string;
  swatches: string[];
};

export type ColorInfluenceMode = "surprise" | "single" | "palette" | "description";
export type UserColorInfluence = {
  mode: ColorInfluenceMode;
  colors: string[];
  description: string;
};

// Maps common color words to seed hexes per spec.
const COLOR_WORD_MAP: Record<string, string[]> = {
  sunset: ["#FF7E47", "#FF4FA1", "#A35BFF"],
  ocean: ["#1F8A9A", "#2D5FAE", "#7AD0C8"],
  teal: ["#1F8A9A", "#7AD0C8"],
  winter: ["#A8D6F2", "#D6E2EC", "#FFFFFF"],
  ice: ["#A8D6F2", "#FFFFFF"],
  icy: ["#A8D6F2", "#D6E2EC"],
  neon: ["#3DD2FF", "#FF3DA1", "#A8E04F"],
  gold: ["#F1C75B", "#E89B4A", "#FFE3B0"],
  amber: ["#E89B4A", "#F1C75B"],
  yellow: ["#F8E16C", "#FFE3A3"],
  cream: ["#FFE3B0", "#FFFBEA"],
  dark: ["#1B1230", "#1A1335", "#3A0F2A"],
  black: ["#0A0814", "#1B1230"],
  navy: ["#0E1638", "#1F2D4F"],
  crimson: ["#8C1E3F", "#B22B3A"],
  rose: ["#E48498", "#F4C2A1"],
  pink: ["#FF8FC3", "#FFB6D5", "#FF4FCB"],
  blush: ["#F5D6E0", "#F0C7D4"],
  magenta: ["#FF3DA1", "#FF4FCB"],
  green: ["#3FD0C9", "#A8E04F", "#3B8C6E"],
  emerald: ["#3B8C6E", "#1F8A9A"],
  lime: ["#A8E04F"],
  seafoam: ["#7AD0C8", "#A9DCE6"],
  red: ["#C0392B", "#8C1E3F", "#E37A4A"],
  burgundy: ["#5C1E2E", "#7E2F4D"],
  coral: ["#E8927C", "#FF8E72"],
  purple: ["#5C2D75", "#9C2BFF", "#B57BFF"],
  violet: ["#5B3494", "#9C2BFF"],
  lavender: ["#C4B5F0", "#D6C8FF"],
  plum: ["#5E3F5C", "#7E2F4D"],
  blue: ["#2D5FAE", "#3DA9FF"],
  electric: ["#3DD2FF", "#9C2BFF"],
  cold: ["#A8D6F2", "#2D5FAE"],
  white: ["#FFFFFF", "#F2F2F2"],
  silver: ["#D6E2EC", "#A9B6CC"],
  orange: ["#FF7E47", "#E89B4A"],
  dusty: ["#C7BBD2", "#B58FA6"],
  bedroom: ["#F5D6E0", "#C7BBD2"],
};

export function colorWordsToHex(text: string): string[] {
  if (!text) return [];
  const seeds: string[] = [];
  // Direct hex matches like "#aabbcc"
  const hexMatches = text.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
  for (const hx of hexMatches) seeds.push(hx);
  const lower = text.toLowerCase();
  for (const [word, hexes] of Object.entries(COLOR_WORD_MAP)) {
    if (lower.includes(word)) seeds.push(...hexes);
  }
  // dedupe, cap 5
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of seeds) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}

function buildPalette(
  moods: string[],
  keyProfile: KeyProfile | null,
  seed: number,
  influence?: UserColorInfluence | null,
): AuraPalette {
  const moodColors: string[] = [];
  for (const m of moods) {
    const t = MOOD_TRAITS[m]; if (!t) continue;
    moodColors.push(...t.colors);
  }
  if (moodColors.length === 0) moodColors.push("#7C8AB8","#5C5E94","#F4C2A1","#E48498");
  const keyColors = keyProfile?.colors ?? [];
  const pickIdx = (arr:string[], i:number) => arr[((seed>>>i)|0) % arr.length];
  const pA = pickIdx(moodColors, 1);
  const pB = keyColors.length ? pickIdx(keyColors, 3) : pickIdx(moodColors, 7);
  const enginePrimary = mixHex(pA, pB, 0.4);
  const engineSecondary = pickIdx(moodColors, 5);
  const engineAccent = keyColors.length ? pickIdx(keyColors, 11) : pickIdx(moodColors, 13);

  // Resolve user seeds
  let userSeeds: string[] = [];
  if (influence && influence.mode !== "surprise") {
    if (influence.mode === "single") userSeeds = influence.colors.slice(0, 1);
    else if (influence.mode === "palette") userSeeds = influence.colors.slice(0, 5);
    else if (influence.mode === "description") userSeeds = colorWordsToHex(influence.description);
  }
  userSeeds = userSeeds.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));

  let primary: string, secondary: string, accent: string;
  if (userSeeds.length === 0) {
    primary = enginePrimary;
    secondary = engineSecondary;
    accent = engineAccent;
  } else {
    // Strong influence: ~30% engine / 70% user when guided.
    // First seed dominates primary, second seed (if present) owns secondary,
    // last seed owns accent so the glow visibly pulls toward user color.
    primary = mixHex(enginePrimary, userSeeds[0], 0.7);
    secondary = userSeeds.length >= 2
      ? mixHex(engineSecondary, userSeeds[1], 0.7)
      : mixHex(engineSecondary, userSeeds[0], 0.45);
    accent = userSeeds[userSeeds.length - 1];
  }

  const shadow = darken(primary, 0.55);
  // When influenced, keep glow truer to the user's color (less hue drift).
  const glowHueDrift = userSeeds.length ? ((seed >>> 17) % 12) - 6 : ((seed >>> 17) % 30) - 15;
  const glow = lighten(shiftHue(accent, glowHueDrift), 0.18);
  const particle = lighten(shiftHue(accent, 30), 0.25);

  const swatchSeeds = userSeeds.length
    ? [primary, secondary, accent, ...userSeeds, lighten(accent, 0.18), glow]
    : [primary, secondary, accent, lighten(primary,0.18), darken(secondary,0.2), glow];
  const swatches = Array.from(new Set(swatchSeeds.map((s) => s.toLowerCase())))
    .map((lc) => swatchSeeds.find((s) => s.toLowerCase() === lc)!)
    .slice(0, 6);

  return { primary, secondary, accent, shadow, glow, particle, swatches };
}

// ----------------- naming -----------------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick<T>(list: readonly T[], seed: number): T { return list[seed % list.length]; }

// ----------------- hue family detection -----------------
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l };
}

export type HueFamilyKey =
  | "red" | "ember" | "amber" | "gold" | "chartreuse" | "green" | "jade"
  | "teal" | "cyan" | "blue" | "indigo" | "violet" | "magenta" | "rose"
  | "neutral" | "pearl" | "onyx";

type HueFamily = {
  key: HueFamilyKey;
  colorWords: string[];   // used in names (palette + aura)
  pairNouns?: string[];   // poetic phrases (e.g. "Verdant Mist")
};

const HUE_FAMILIES: Record<HueFamilyKey, HueFamily> = {
  red:        { key: "red",        colorWords: ["Crimson","Scarlet","Garnet","Ruby","Cinnabar"] },
  ember:      { key: "ember",      colorWords: ["Ember","Rust","Sienna","Terracotta","Copper"] },
  amber:      { key: "amber",      colorWords: ["Amber","Honey","Marigold","Saffron","Brass"] },
  gold:       { key: "gold",       colorWords: ["Golden","Sunlit","Citrine","Topaz","Daffodil"] },
  chartreuse: { key: "chartreuse", colorWords: ["Chartreuse","Lime","Citron","Spring","Pear"] },
  green:      { key: "green",      colorWords: ["Verdant","Moss","Fern","Sage","Forest"] },
  jade:       { key: "jade",       colorWords: ["Jade","Emerald","Mint","Seafoam","Pine"] },
  teal:       { key: "teal",       colorWords: ["Teal","Aquamarine","Lagoon","Tide","Cerulean"] },
  cyan:       { key: "cyan",       colorWords: ["Cyan","Glacier","Frost","Ice","Sky"] },
  blue:       { key: "blue",       colorWords: ["Azure","Cobalt","Sapphire","Marine","Indigo"] },
  indigo:     { key: "indigo",     colorWords: ["Indigo","Midnight","Twilight","Nocturne","Velvet"] },
  violet:     { key: "violet",     colorWords: ["Violet","Amethyst","Iris","Lilac","Orchid"] },
  magenta:    { key: "magenta",    colorWords: ["Magenta","Fuchsia","Neon","Plasma","Berry"] },
  rose:       { key: "rose",       colorWords: ["Rose","Coral","Blush","Petal","Peach"] },
  neutral:    { key: "neutral",    colorWords: ["Smoke","Ash","Slate","Linen","Dust"] },
  pearl:      { key: "pearl",      colorWords: ["Pearl","Ivory","Alabaster","Cream","Snow"] },
  onyx:       { key: "onyx",       colorWords: ["Onyx","Obsidian","Shadow","Charcoal","Raven"] },
};

function hueToFamily(h: number, s: number, l: number): HueFamilyKey {
  if (s < 0.12) {
    if (l > 0.78) return "pearl";
    if (l < 0.22) return "onyx";
    return "neutral";
  }
  if (h < 15) return "red";
  if (h < 30) return "ember";
  if (h < 45) return "amber";
  if (h < 65) return "gold";
  if (h < 85) return "chartreuse";
  if (h < 145) return l < 0.5 ? "green" : "jade";
  if (h < 175) return "jade";
  if (h < 195) return "teal";
  if (h < 210) return "cyan";
  if (h < 240) return "blue";
  if (h < 270) return "indigo";
  if (h < 300) return "violet";
  if (h < 330) return "magenta";
  return "rose";
}

/** Returns the 1-2 most prominent hue families across the palette swatches. */
function dominantHueFamilies(colors: AuraPalette): HueFamilyKey[] {
  const samples = [colors.primary, colors.accent, colors.secondary, ...(colors.swatches ?? [])];
  const tally: Partial<Record<HueFamilyKey, number>> = {};
  let chromaticTotal = 0;
  for (const hex of samples) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
    const { h, s, l } = hexToHsl(hex);
    const fam = hueToFamily(h, s, l);
    // weight chromatic samples higher so a few greys don't dominate
    const w = s < 0.15 ? 0.4 : 1;
    if (s >= 0.15) chromaticTotal += 1;
    tally[fam] = (tally[fam] ?? 0) + w;
  }
  const sorted = Object.entries(tally)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([k]) => k as HueFamilyKey);
  if (sorted.length === 0) return ["neutral"];
  // If almost no chromatic samples, fall back to a neutral family
  if (chromaticTotal <= 1) return [sorted[0]];
  // Only return a second family if it's distinct enough
  const out = [sorted[0]];
  if (sorted[1] && (tally[sorted[1]] ?? 0) >= (tally[sorted[0]] ?? 0) * 0.55 && sorted[1] !== sorted[0]) {
    out.push(sorted[1]);
  }
  return out;
}

// Modifier words tuned by saturation/lightness of the primary color.
function paletteModifier(hex: string, seed: number): string | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const { s, l } = hexToHsl(hex);
  const variants: string[] = [];
  if (l > 0.75) variants.push("Pale", "Soft", "Glass");
  else if (l < 0.28) variants.push("Deep", "Smoked", "Velvet");
  else variants.push("Dusky", "Hazy", "Muted");
  if (s > 0.7) variants.push("Neon", "Electric", "Radiant");
  if (s < 0.25) variants.push("Faded", "Quiet");
  // 55% chance to omit modifier for cleaner two-word names
  if ((seed & 0xff) < 115) return null;
  return variants[seed % variants.length];
}

const TEX_WORDS = ["Drift","Bloom","Halo","Tide","Mirage","Static","Glass","Velvet","Reverie","Weather","Mercy","Echo","Pressure","Rain","Memory","Voltage","Ember","Hush","Hour"];

// Curated names reserved for low-saturation / ambiguous palettes only.
const NEUTRAL_PALETTE_BANK = [
  "Ash Mirror","Pearl Static","Slate Reverie","Linen Drift","Smoke Halo",
  "Onyx Bloom","Obsidian Hour","Snowfield","Charcoal Glass","Ivory Tide",
];

function paletteName(
  seed: number,
  moods: string[],
  kp: KeyProfile | null,
  colors: AuraPalette,
): string {
  const families = dominantHueFamilies(colors);
  const h = hash(`pn|${seed}|${moods.join(",")}|${kp?.tonic ?? ""}`);

  // Ambiguous / mostly neutral palette: use the curated neutral bank or family color words
  if (families[0] === "neutral" || families[0] === "pearl" || families[0] === "onyx") {
    if ((h & 3) === 0) return pick(NEUTRAL_PALETTE_BANK, h >>> 5);
    const fam = HUE_FAMILIES[families[0]];
    return `${pick(fam.colorWords, h)} ${pick(TEX_WORDS, h >>> 7)}`;
  }

  // Two-tone palette name when two distinct families show up
  if (families.length === 2) {
    const a = pick(HUE_FAMILIES[families[0]].colorWords, h);
    const b = pick(HUE_FAMILIES[families[1]].colorWords, h >>> 5);
    if (a.toLowerCase() === b.toLowerCase()) {
      return `${a} ${pick(TEX_WORDS, h >>> 9)}`;
    }
    // Roughly half the time: "Ember & Jade Drift"; otherwise "Ember Jade"
    return (h & 1)
      ? `${a} & ${b} ${pick(TEX_WORDS, h >>> 11)}`
      : `${a} ${b}`;
  }

  // Single-family name with optional saturation/lightness modifier
  const fam = HUE_FAMILIES[families[0]];
  const colorWord = pick(fam.colorWords, h);
  const texWord = pick(TEX_WORDS, h >>> 7);
  const mod = paletteModifier(colors.primary, h >>> 13);
  return mod ? `${mod} ${colorWord} ${texWord}` : `${colorWord} ${texWord}`;
}

// ----------------- aura naming -----------------
// Curated names — kept as occasional flavor only.
const AURA_NAME_BANK = [
  "Velvet Current","Blue Hour Bloom","Electric Reverie","Candlewave","Midnight Tide",
  "Golden Static","Dusk Mirage","Lunar Ember","Silver Echo","Soft Collapse",
  "Ocean Memory","Neon Haze","Afterglow Theory","Slow Halo",
  "Crimson Shore","Dream Pressure","Ghostlight Summer","Satin Weather","Moonlit Static",
  "Amber Distance","Glass Tide","Heavy Honey","Saltwater Echo","Night Bloom",
  "Tender Voltage","Hollow Sunset","Velvet Gravity","Celestial Ache","Radiant Fog",
  "Soft Thunder","Pearl Fever","Storm Halo","Electric Chapel","Blue Velvet Rain",
  "Quiet Fire","Neon Prayer","Afterhours Bloom","Jade Mercy","Verdant Hour",
  "Emerald Drift","Citrine Halo","Cobalt Sigh","Rose Voltage","Coral Memory",
  "Sapphire Weather","Iris Static","Topaz Bloom","Moss Mirage","Fern Tide",
];
const PATTERN_NOUN_MAJOR = [
  "Bloom","Halo","Tide","Drift","Mirage","Reverie","Bloom","Rise","Hour","Dawn","Glow","Light",
];
const PATTERN_NOUN_MINOR = [
  "Static","Echo","Pressure","Mercy","Weather","Shadow","Ache","Hush","Dusk","Rain","Voltage","Smoke",
];
const PATTERN_B_EMO_MAJOR = ["Tender","Quiet","Dream","Soft","Open","Radiant","Glowing","Buoyant"];
const PATTERN_B_EMO_MINOR = ["Lonely","Hollow","Heavy","Restless","Tender","Velvet","Quiet","Haunted"];
const PATTERN_B_TEX = ["Static","Velvet","Voltage","Pressure","Weather","Glass","Bloom","Halo","Mirror"];
const TIME_WORDS = ["Midnight","Blue Hour","Afterglow","Dusk","Twilight","Nightfall","Dawn","Sunrise","Witch Hour"];
const MOTION_WORDS = ["Drift","Bloom","Tide","Halo","Mirage","Pulse","Rise","Sway","Spiral"];

const RECENT_BLOCK = new Set(["Coastal Drift","Quiet Drift","Dark Glow"]);

export function auraNameFor(
  seedKey: string,
  moods: string[],
  kp?: KeyProfile | null,
  colors?: AuraPalette | null,
): string {
  const h = hash(`an|${seedKey}|${moods.join(",")}|${kp?.tonic ?? ""}`);
  const isMinor = kp?.mode === "minor";
  const families = colors ? dominantHueFamilies(colors) : ["violet" as HueFamilyKey];
  const familyWords = HUE_FAMILIES[families[0]].colorWords;
  const nounBank = isMinor ? PATTERN_NOUN_MINOR : PATTERN_NOUN_MAJOR;
  const emoBank = isMinor ? PATTERN_B_EMO_MINOR : PATTERN_B_EMO_MAJOR;

  for (let i = 0; i < 5; i++) {
    const r = (h >>> (i * 3)) & 7;
    let name = "";
    if (r === 0) {
      // Occasional pull from curated bank
      name = pick(AURA_NAME_BANK, h >>> (i + 1));
    } else if (r < 4) {
      // Hue-family color + mood-mode noun  (most common — guarantees palette match)
      name = `${pick(familyWords, h >>> 4)} ${pick(nounBank, h >>> 9)}`;
    } else if (r < 6) {
      // Emotion + texture
      name = `${pick(emoBank, h >>> 6)} ${pick(PATTERN_B_TEX, h >>> 11)}`;
    } else {
      // Time + motion (mood-agnostic flavor)
      name = `${pick(TIME_WORDS, h >>> 8)} ${pick(MOTION_WORDS, h >>> 13)}`;
    }
    if (!RECENT_BLOCK.has(name)) return name;
  }
  return `${pick(familyWords, h)} ${pick(nounBank, h >>> 9)}`;
}

// ----------------- vocabulary banks -----------------
const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
const MINOR_BIAS_KEY = new Set<MoodKey>(["melancholy","dark","mysterious","nostalgic","intimate"]);
const MAJOR_BIAS_KEY = new Set<MoodKey>(["warm","euphoric","coastal","energetic","dreamy"]);

// Used to bias palette/description language by audio features.
export const ADJECTIVE_BANK = [
  "aching","tender","restless","radiant","haunted","golden","bruised","weightless",
  "intimate","feverish","wistful","electric","velvet","smoky","fragile","luminous",
  "heavy","sacred","glossy","muted","storm-lit","moonlit","sun-washed","nocturnal",
  "cinematic","raw","analog","honeyed","shadowed",
];
export const TEXTURE_ADJ_BANK = [
  "glass","velvet","smoke","mist","static","saltwater","ember","chrome","pearl",
  "dust","candlelight","frost","silk","grain","neon","ash","bloom","current","haze","rain","amber",
];
export const NOUN_BANK = [
  "tide","chapel","weather","signal","memory","voltage","halo","static","echo","fever",
  "bloom","current","mercy","distance","pressure","shoreline","mirage","afterglow","rain",
  "velvet","ghostlight","ember","dusk","orbit","glass","ache",
];


export type MusicalKey = string;
export type TempoBand = "Slow" | "Mid" | "Fast";
// Extended density vocabulary; legacy values still accepted as strings.
export type Density = string;
export const DENSITY_LABELS = [
  "Sparse", "Airy", "Light", "Open", "Balanced", "Full", "Dense", "Heavy", "Saturated", "Layered", "Overgrown",
] as const;
export type DensityLabel = (typeof DENSITY_LABELS)[number];

/** Map a 0..1 density score to a poetic label. */
export function densityLabelFromScore(score: number): DensityLabel {
  const s = Math.max(0, Math.min(1, score));
  if (s < 0.12) return "Sparse";
  if (s < 0.22) return "Airy";
  if (s < 0.32) return "Light";
  if (s < 0.42) return "Open";
  if (s < 0.55) return "Balanced";
  if (s < 0.66) return "Full";
  if (s < 0.76) return "Dense";
  if (s < 0.84) return "Heavy";
  if (s < 0.90) return "Saturated";
  if (s < 0.96) return "Layered";
  return "Overgrown";
}

/** Texture keywords pulled from selected moods + density character. */
const TEXTURE_BANK_BY_DENSITY: Record<string, string[]> = {
  low:  ["mist", "glass", "air", "pearl", "frost", "silk"],
  mid:  ["velvet", "silk", "haze", "candlelight", "amber", "dust"],
  high: ["smoke", "ember", "static", "ash", "neon", "grain"],
};
export function textureKeywordsFor(moods: string[], densityScore?: number, seed = 0): string[] {
  const out = new Set<string>();
  for (const m of moods) {
    const t = MOOD_TRAITS[m];
    if (!t) continue;
    out.add(t.texture);
  }
  const bucket = densityScore == null
    ? "mid"
    : densityScore < 0.35 ? "low" : densityScore > 0.65 ? "high" : "mid";
  const bank = TEXTURE_BANK_BY_DENSITY[bucket];
  out.add(bank[seed % bank.length]);
  out.add(bank[(seed >>> 3) % bank.length]);
  return Array.from(out).slice(0, 4);
}

export function energyFor(seedKey: string, moods: string[]): number {
  const base = 35 + (hash(seedKey) % 60);
  let bias = 0;
  for (const m of moods) bias += MOOD_TRAITS[m]?.energyBias ?? 0;
  return Math.max(20, Math.min(98, Math.round(base + bias)));
}

export function keyFor(seedKey: string, mood: MoodKey): MusicalKey {
  const h = hash(seedKey + "|key|" + mood);
  const note = NOTES[h % NOTES.length];
  const bit = (h >>> 5) & 3;
  const minor = MINOR_BIAS_KEY.has(mood) ? bit !== 0 : MAJOR_BIAS_KEY.has(mood) ? bit === 0 : bit < 2;
  return `${note} ${minor ? "minor" : "major"}`;
}

export function tempoBandFor(energy: number): TempoBand {
  if (energy < 45) return "Slow";
  if (energy < 75) return "Mid";
  return "Fast";
}

const DENSE_MOODS_K = new Set<MoodKey>(["cinematic","euphoric","energetic","dark"]);
const SPARSE_MOODS_K = new Set<MoodKey>(["intimate","melancholy","nostalgic"]);
export function densityFor(seedKey: string, mood: MoodKey): Density {
  const h = hash(seedKey + "|d|" + mood) >>> 4;
  if (DENSE_MOODS_K.has(mood)) return (h & 1) ? "Dense" : "Lush";
  if (SPARSE_MOODS_K.has(mood)) return (h & 1) ? "Sparse" : "Lush";
  return (h & 3) === 0 ? "Dense" : (h & 3) === 1 ? "Sparse" : "Lush";
}

// ----------------- descriptions -----------------
const SHORT_TEMPLATES_MAJOR = [
  "A {tone} aura with {colorPhrase}, lit by {motionPhrase} and {edge}.",
  "{Tone} light blooming through {colorPhrase}, carried by {motionPhrase}.",
  "An open {tone} aura — {colorPhrase}, {motionPhrase}, {edge}.",
];
const SHORT_TEMPLATES_MINOR = [
  "A {tone} aura with {colorPhrase}, shaped by {motionPhrase} and {edge}.",
  "{Tone} weather of {colorPhrase}, {motionPhrase} beneath {edge}.",
  "A {tone} minor-key aura — {colorPhrase}, {motionPhrase}, {edge}.",
];

// Vibe is now 2-3 short sentences. Sentence 1 = scene, sentence 2 = color/motion,
// sentence 3 (optional) = tempo/density coda.
const VIBE_FRAMES_MAJOR = [
  "Feels like {scene}.",
  "Plays like {scene}.",
  "Moves like {scene}.",
];
const VIBE_FRAMES_MINOR = [
  "Feels like {scene}.",
  "Sits inside {scene}.",
  "Lingers like {scene}.",
];
const SCENE_BANK_MINOR = [
  "driving home under city lights with something unsaid in your chest",
  "the edge of a decision while the night gets louder than your thoughts",
  "an old feeling coming back at the wrong time",
  "rain on a window you're not opening",
  "a memory you never fully left",
  "the last cigarette of a long week",
  "the room after everyone leaves",
];
const SCENE_BANK_MAJOR = [
  "the first warm hour after a long week",
  "sun cutting through a curtain at the right moment",
  "a road opening up just as the song hits",
  "a bright morning that owes you nothing and gives you everything",
  "walking back into a room that finally feels like yours",
  "the moment a city skyline tips into gold",
  "a quiet win you didn't tell anyone about",
];

const COLOR_SENTENCES_MAJOR = [
  "{Color} air keeps moving in {motion}.",
  "It glows in {color}, breathing through {motion}.",
  "Light gathers in {color} and lifts on {motion}.",
];
const COLOR_SENTENCES_MINOR = [
  "{Color} shadow drifts under {motion}.",
  "It hangs in {color}, slow with {motion}.",
  "{Color} weather pulls through {motion}.",
];

const TEMPO_CODAS_FAST = [
  "It doesn't sit still.",
  "It runs ahead of you.",
  "It pulses faster than you expect.",
];
const TEMPO_CODAS_MID = [
  "It moves at the speed of a long thought.",
  "It keeps its own steady pulse.",
];
const TEMPO_CODAS_SLOW = [
  "It takes its time.",
  "It barely breathes.",
  "It almost stops — and that's the point.",
];

function fillTemplate(tmpl: string, parts: Record<string,string>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => parts[k] ?? "");
}

function cleanSeed(s: string): string {
  let t = s.trim().replace(/\s+/g, " ");
  if (t.length > 180) t = t.slice(0, 177).replace(/[,\s]+\S*$/, "") + "…";
  if (t && !/[.!?…]$/.test(t)) t += ".";
  // Capitalize first letter for consistency.
  if (t) t = t[0].toUpperCase() + t.slice(1);
  return t;
}

export function generateDescriptions(opts: {
  seedKey: string; moods: string[]; kp: KeyProfile | null; baseKey: MoodKey;
  colors?: AuraPalette | null;
  tempoBand?: TempoBand;
  vibeSeed?: string;
}): { short: string; vibe: string; motionKeywords: string[] } {
  const { seedKey, moods, kp, baseKey, colors, tempoBand, vibeSeed } = opts;
  const h = hash(`desc|${seedKey}|${moods.join(",")}|${kp?.tonic ?? ""}|${kp?.mode ?? ""}`);
  const isMinor = kp?.mode === "minor" || (!kp && MINOR_BIAS_KEY.has(baseKey));
  const personality = PERSONALITIES[baseKey];
  const tone = pick(personality.phrases.tone, h);
  const colorPhrase = pick(personality.phrases.color, h >>> 3);
  const edge = pick(personality.phrases.edge, h >>> 6);
  const motionPhrase = pick(personality.phrases.motion, h >>> 9);
  const tmpl = pick(isMinor ? SHORT_TEMPLATES_MINOR : SHORT_TEMPLATES_MAJOR, h >>> 12);
  const short = fillTemplate(tmpl, {
    tone, Tone: tone[0].toUpperCase() + tone.slice(1),
    colorPhrase, motionPhrase, edge,
  });

  // --- new 2-3 sentence vibe ---
  // Hue-family color word for sentence 2 (so green palette → "Verdant" not "Violet")
  let hueColorWord = pick(personality.phrases.color, h >>> 3);
  if (colors) {
    const fams = dominantHueFamilies(colors);
    if (fams[0] && fams[0] !== "neutral") {
      hueColorWord = pick(HUE_FAMILIES[fams[0]].colorWords, h >>> 4);
    }
  }
  const sceneBank = isMinor ? SCENE_BANK_MINOR : SCENE_BANK_MAJOR;
  const frameBank = isMinor ? VIBE_FRAMES_MINOR : VIBE_FRAMES_MAJOR;
  const colorSentBank = isMinor ? COLOR_SENTENCES_MINOR : COLOR_SENTENCES_MAJOR;

  const sceneSentence = fillTemplate(pick(frameBank, h >>> 15), {
    scene: pick(sceneBank, h >>> 18),
  });
  const colorSentence = fillTemplate(pick(colorSentBank, h >>> 21), {
    color: hueColorWord.toLowerCase(),
    Color: hueColorWord,
    motion: motionPhrase,
  });

  // Optional tempo coda — included ~60% of the time
  const codaBank = tempoBand === "Fast"
    ? TEMPO_CODAS_FAST
    : tempoBand === "Slow"
      ? TEMPO_CODAS_SLOW
      : TEMPO_CODAS_MID;
  const includeCoda = ((h >>> 24) & 7) < 5;
  const coda = includeCoda ? " " + pick(codaBank, h >>> 26) : "";

  let vibe: string;
  const seed = vibeSeed?.trim() ?? "";
  if (seed) {
    // User-seeded: keep their wording, append ONE generator sentence to fine-tune.
    vibe = `${cleanSeed(seed)} ${colorSentence}`;
  } else {
    vibe = `${sceneSentence} ${colorSentence}${coda}`;
  }

  // motion keywords from selected moods
  const words = new Set<string>();
  for (const m of moods) for (const w of MOOD_TRAITS[m]?.motionWords ?? []) words.add(w);
  if (words.size === 0) for (const w of personality.phrases.motion) words.add(w.split(" ").slice(-1)[0]);
  const motionKeywords = Array.from(words).slice(0, 5);
  return { short, vibe, motionKeywords };
}

// legacy helper retained
export function descriptionFor(moods: string[], moodKey: MoodKey, seed = ""): string {
  return generateDescriptions({ seedKey: seed, moods, kp: null, baseKey: moodKey }).short;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/['"`]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);
}

// ----------------- top-level generator -----------------
export type SourceType = "upload" | "platform_link" | "raw_recording";
export type PitchCenter = { note: string; hz: number };

export type AuraProfile = {
  palette: MoodKey;
  auraName: string;
  paletteName: string;
  energy: number;
  description: string;
  vibeDescription: string;
  motionKeywords: string[];
  musicalKey: string;
  tonic?: string;
  mode?: "major" | "minor";
  keyDetected?: boolean;
  keyConfidence?: number;
  pitchCenter?: PitchCenter;
  sourceType?: SourceType;
  tempoBand: TempoBand;
  density: Density;
  colors: AuraPalette;
  userColorInfluence?: UserColorInfluence;
  colorGuided?: boolean;
};

const RAW_NAME_BANK = [
  "Raw Velvet","Voice Ember","Midnight Sketch","Hook Ghost",
  "Soft Signal","First Take Bloom","Dry Echo","Bedroom Static",
  "Whisper Static","Demo Halo","Tape Bloom","Late Hum",
];

const RAW_TEMPLATES = [
  "A raw vocal idea with {tone} shadow, soft pitch movement, and a late-night sketchbook feeling.",
  "An unfinished but emotional signal — {colorPhrase}, glowing around the edges like a melody before it becomes a song.",
  "A raw sketch of {tone} air, half-formed and honest, holding an idea before it's fully shaped.",
];

export function generateAura(input: {
  id: string; title: string; artist: string;
  moods: string[]; detectedKey?: string | null;
  pitchCenter?: PitchCenter | null;
  energyOverride?: number | null;
  keyConfidence?: number | null;
  sourceType?: SourceType;
  userColorInfluence?: UserColorInfluence | null;
  /** Optional user-written seed for the vibe description — fine-tunes rather than replaces. */
  vibeSeed?: string | null;
}): AuraProfile {
  const baseKey = personalityFromMoods(input.moods);
  const seedKey = input.id || `${input.artist}-${input.title}`;
  const seed = hash(seedKey);
  const energy = input.energyOverride != null
    ? Math.max(15, Math.min(99, Math.round(input.energyOverride)))
    : energyFor(seedKey, input.moods);

  const conf = input.keyConfidence ?? null;
  const keyUncertain = conf != null && conf < 0.15;
  const detected = !keyUncertain ? resolveKeyProfile(input.detectedKey) : null;
  const fallbackKey = keyFor(seedKey, baseKey);
  const musicalKey = detected
    ? `${detected.tonic} ${detected.mode}`
    : keyUncertain
      ? "Unknown"
      : fallbackKey;
  const kp = detected ?? (keyUncertain ? null : resolveKeyProfile(musicalKey));

  const colors = buildPalette(input.moods, kp, seed, input.userColorInfluence ?? null);
  const tempoBand = tempoBandFor(energy);
  const influence = input.userColorInfluence ?? null;
  const colorGuided = !!(influence && influence.mode !== "surprise" && (
    (influence.mode === "single" && influence.colors.length > 0) ||
    (influence.mode === "palette" && influence.colors.length > 0) ||
    (influence.mode === "description" && colorWordsToHex(influence.description).length > 0)
  ));
  const desc = generateDescriptions({
    seedKey, moods: input.moods, kp, baseKey, colors, tempoBand,
    vibeSeed: input.vibeSeed ?? undefined,
  });

  const isRaw = input.sourceType === "raw_recording";
  const h = hash(`raw|${seedKey}|${input.moods.join(",")}`);
  const auraName = isRaw && (h % 10) < 7
    ? pick(RAW_NAME_BANK, h)
    : auraNameFor(seedKey, input.moods, kp, colors);

  let description = desc.short;
  if (isRaw) {
    const tmpl = pick(RAW_TEMPLATES, h >>> 5);
    const personality = PERSONALITIES[baseKey];
    description = fillTemplate(tmpl, {
      tone: pick(personality.phrases.tone, h),
      colorPhrase: pick(personality.phrases.color, h >>> 3),
    });
  }

  return {
    palette: baseKey,
    auraName,
    paletteName: paletteName(seed, input.moods, kp, colors),
    energy,
    description,
    vibeDescription: desc.vibe,
    motionKeywords: desc.motionKeywords,
    musicalKey,
    tonic: kp?.tonic,
    mode: kp?.mode,
    keyDetected: !!detected,
    keyConfidence: conf ?? undefined,
    pitchCenter: input.pitchCenter ?? undefined,
    sourceType: input.sourceType,
    tempoBand,
    density: densityFor(seedKey, baseKey),
    colors,
    userColorInfluence: influence ?? undefined,
    colorGuided,
  };
}
