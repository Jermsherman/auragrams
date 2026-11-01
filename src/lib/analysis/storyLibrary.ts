/** Tagged lines for the free Read. Each fragment is chosen only when its tags match measured facts. */

export type StoryRole = "open" | "palette" | "ground" | "section" | "arc" | "measure" | "close" | "change" | "vocal";

export type StoryFragment = {
  id: string;
  role: StoryRole;
  voice: string | null;
  tags: string[];
  len: "short" | "long";
  text: string;
};

const library: StoryFragment[] = [];

function add(
  role: StoryRole,
  voice: string | null,
  tags: string[],
  len: "short" | "long",
  lines: string[],
) {
  for (const text of lines) {
    library.push({
      id: `${role}-${library.length}`,
      role,
      voice,
      tags,
      len,
      text,
    });
  }
}

const short = "short" as const;
const long = "long" as const;

add("open", "cinematic", [], short, [
  "A wide frame holds the first second.",
  "The shot opens larger than the room.",
  "Distance first. Then the sound.",
  "The picture is already a landscape.",
  "Nothing hurries the establishing shot.",
  "A long view, before the detail.",
]);
add("open", "cinematic", [], long, [
  "The frame stays wide while the first bars find their place in it.",
  "Weather gathers at the edges of the picture, and the music steps into that scale.",
  "This begins like a shot that refuses a close-up, with room left on every side.",
  "The opening image is a horizon, and the track walks toward it instead of filling it.",
  "Light is spread across the whole frame before any single color takes the center.",
  "A cinematic width is the first fact: the song does not start in a corner.",
]);

add("open", "intimate", [], short, [
  "The first sound sits close.",
  "A small room, and the track inside it.",
  "Nearness is the opening fact.",
  "This begins at arm's length.",
  "The picture is a close crop.",
  "Quiet furniture. Then the music.",
]);
add("open", "intimate", [], long, [
  "The opening image is a small room with the lamp already on, and the song stays inside that distance.",
  "Nothing here is staged for a crowd. The first second is close enough to count as a confidence.",
  "It starts the way a conversation starts, already close, with the rest of the room left out.",
  "The frame is tight, the kind of opening that keeps the rest of the song nearby.",
  "An intimate scale: the track begins as if the listener were already in the chair.",
  "The first image is a table, a glass, and the level of the music sitting between them.",
]);

add("open", "nocturnal", [], short, [
  "The opening belongs to the late hour.",
  "A lamp, then the track.",
  "Night is the first color of the frame.",
  "This starts after the street has thinned.",
  "Low light, and the song under it.",
  "The picture is already after dark.",
]);
add("open", "nocturnal", [], long, [
  "The opening image is a street that has already gone quiet, with the track as the only moving thing.",
  "Night is not a mood pasted on. The palette and the pace both sit in the late register.",
  "A single lamp would be enough scenery. The song begins in that kind of frame.",
  "The first second feels like a room where the overhead light was never switched on.",
  "Nocturne scale: the picture is dark at the edges and the music does not correct it.",
  "It opens the way a city opens after midnight, with more shadow than traffic.",
]);

add("open", "kinetic", [], short, [
  "The picture is already moving.",
  "No still frame. The track enters at speed.",
  "The opening cuts in late and fast.",
  "Motion first. Explanation later.",
  "The first second is a step already taken.",
  "This does not wait to be arranged.",
]);
add("open", "kinetic", [], long, [
  "The opening image is a cut, not a fade, and the tempo is what makes the cut feel earned.",
  "Kinetic from the first bar: the song arrives as if the listener had matched its speed.",
  "There is no establishing stillness. The frame is a body already in motion.",
  "The picture starts mid-stride, which is what a fast measured pulse looks like as an image.",
  "Light smears because the track does not hold still long enough to pose.",
  "An opening like a door pushed, not opened, with the BPM already decided.",
]);

add("open", "warm", [], short, [
  "Warmth is the first temperature of the frame.",
  "The opening glows before it explains itself.",
  "A hearth-scale picture, then the song.",
  "The first color is a held heat.",
  "This begins like a room that has been lived in.",
  "Gold at the edge of the opening image.",
]);
add("open", "warm", [], long, [
  "The opening image is heat without spectacle: a register the palette and the feel both allow.",
  "Wood, late light, and a song that sits in that temperature instead of above it.",
  "Soulful scale, kept honest: the warmth is the measured color family, not a biography.",
  "It starts the way a chorus of lamps would, close and amber, before the map of the song begins.",
  "The first second is generous. The frame has a center and the center is warm.",
  "An opening portrait in a warm key of color, with the track stepping into it at its own pace.",
]);

add("open", "cold", [], short, [
  "The frame is spare on purpose.",
  "Cold light, and very little furniture.",
  "A thin opening. The song does not decorate it.",
  "Glass, distance, and the first bar.",
  "The picture starts almost empty.",
  "Minimal from the first second.",
]);
add("open", "cold", [], long, [
  "The opening image is a clean surface with one sound placed on it, and nothing else asked to arrive.",
  "Cold register: the frame stays pale and the track does not rush to fill the pale.",
  "A minimal picture, the kind that makes a plateau or a narrow image feel like a choice.",
  "Winter light, not weather reporting. The palette and the restraint are what the measurements support.",
  "The first second is an empty room with good acoustics and no extra objects.",
  "It opens like a title card with too much margin, which is the cold version of a beginning.",
]);

add("palette", null, ["palette:warm"], short, [
  "{palette} is the color the tonic earns.",
  "The palette stays in the warm family.",
  "{palette} sits at the center of the frame.",
  "Heat in the color, named {palette}.",
  "A warm swatch, and the name is {palette}.",
]);
add("palette", null, ["palette:warm"], long, [
  "The palette is {palette}, a warm hue taken from the tonic rather than from a mood wheel.",
  "{palette} leads the swatches, so the image stays in ember, brass, and late sun.",
  "Color fact, not costume: {palette} is the primary, and the metaphors stay inside that heat.",
  "Warm palette, {palette} at the front. The rest of the story has to live in that light.",
]);

add("palette", null, ["palette:cool"], short, [
  "{palette} keeps the frame cool.",
  "The palette is {palette}, on the cool side.",
  "Ink and glass, under the name {palette}.",
  "{palette} is the measured hue.",
  "A cool primary: {palette}.",
]);
add("palette", null, ["palette:cool"], long, [
  "{palette} is the tonic's color, so the image stays with tide, ink, and cooled metal.",
  "The palette leads with {palette}. Cool light, and no warmer costume laid on top.",
  "Hue follows the key. {palette} is that hue, and the picture does not repaint it.",
  "A cool family, {palette} first. The metaphors are allowed to be glass, water, and night ink.",
]);

add("palette", null, ["palette:green"], short, [
  "{palette} puts green in the frame.",
  "The palette is living color: {palette}.",
  "{palette}, closer to leaf than to fire.",
  "A green primary, named {palette}.",
  "Verdigris light, from {palette}.",
]);
add("palette", null, ["palette:green"], long, [
  "{palette} is the measured primary, so the image can use moss, canopy, and new growth without inventing a forest.",
  "The palette sits in the green family, with {palette} as the name the tonic produced.",
  "Color from the key: {palette}. The story's plants and metals stay inside that green.",
  "{palette} leads. Any metaphor after this has to be able to live in that shade.",
]);

add("palette", null, ["palette:ash"], short, [
  "The palette is ash, because the key would not name a hue.",
  "Ash, from brightness rather than from a tonic.",
  "A low, gray primary.",
  "The color is ash. The key stayed quiet.",
]);
add("palette", null, ["palette:ash"], long, [
  "With the key unclear, the hue follows brightness and lands on ash: low light, no invented tonic color.",
  "Ash is the honest palette here. There is no tonic to paint, so the picture stays in soot and low lamp.",
]);

add("palette", null, ["palette:haze"], short, [
  "The palette is haze.",
  "Haze, in the middle of the brightness range.",
  "A veiled primary, named haze.",
  "Color without a tonic: haze.",
]);
add("palette", null, ["palette:haze"], long, [
  "The key is unclear, so the palette is haze: a middle brightness, not a note wearing a costume.",
  "Haze is what the spectrum earned. The image can use mist and veil, and cannot use a key color.",
]);

add("palette", null, ["palette:glint"], short, [
  "The palette is glint.",
  "High brightness, named glint.",
  "A thin, bright primary.",
  "Glint, because the key would not claim a hue.",
]);
add("palette", null, ["palette:glint"], long, [
  "No tonic color is available, and the spectrum is bright, so the palette is glint: spark, thin metal, high light.",
  "Glint is the measured stand-in for a key color. The picture stays bright and unnamed.",
]);

add("ground", null, ["tempo:known", "tempo:slow"], short, [
  "{bpm} BPM, in the slow band.",
  "Slow, and the number is {bpm} BPM.",
  "The pulse is slow: {bpm} BPM.",
  "Under 90, measured at {bpm} BPM.",
]);
add("ground", null, ["tempo:known", "tempo:slow"], long, [
  "The tempo band is Slow and the count is {bpm} BPM, so the picture is allowed to take its time.",
  "A slow pulse, not a mood: {bpm} BPM, under the line this app calls Slow.",
  "{bpm} BPM sits in the slow band. Later images have to walk at that speed.",
]);

add("ground", null, ["tempo:known", "tempo:mid"], short, [
  "{bpm} BPM, mid-band.",
  "Mid tempo, {bpm} BPM.",
  "The pulse lands at {bpm} BPM.",
  "Between the slow and the fast: {bpm} BPM.",
]);
add("ground", null, ["tempo:known", "tempo:mid"], long, [
  "Tempo is mid-band, the measured count {bpm} BPM, neither a crawl nor a sprint.",
  "{bpm} BPM puts the song in the middle band, and the story's stride has to match it.",
  "The exact pulse is {bpm} BPM. The band beside it is Mid.",
]);

add("ground", null, ["tempo:known", "tempo:fast"], short, [
  "{bpm} BPM, in the fast band.",
  "Fast, counted at {bpm} BPM.",
  "The pulse is {bpm} BPM.",
  "120 or above: {bpm} BPM.",
]);
add("ground", null, ["tempo:known", "tempo:fast"], long, [
  "The band is Fast and the count is {bpm} BPM, which is why the opening is allowed to feel kinetic.",
  "{bpm} BPM, fast band. The images can move. They cannot pretend the song is a ballad.",
  "A fast grid, measured at {bpm} BPM, is the clock the rest of the story keeps.",
]);

add("ground", null, ["tempo:unclear"], short, [
  "The tempo will not settle on a BPM.",
  "Tempo unclear. No count is claimed.",
  "The pulse stays unnamed.",
  "No reliable BPM.",
]);
add("ground", null, ["tempo:unclear"], long, [
  "Tempo unclear: the onsets never agreed on a BPM, so the story will not invent one.",
  "There is motion, and there is no honest BPM to hang it on. The tempo stays unclear.",
  "The grid would not lock. Tempo unclear, and the images stay free of a false count.",
]);

add("ground", null, ["feel:swung", "tempo:known"], short, [
  "The feel is swung, near {swing}%.",
  "Swing, about {swing}% of the beat.",
  "Not straight: swing near {swing}%.",
]);
add("ground", null, ["feel:swung", "tempo:known"], long, [
  "The feel measures swung, with the offbeat near {swing}% of the beat, so the gait is a lean rather than a march.",
  "Swing is in the onsets, near {swing}%. The story can lope. It cannot call the grid straight.",
]);

add("ground", null, ["feel:straight", "tempo:known"], short, [
  "The grid is straight.",
  "Straight feel, on the counted pulse.",
  "No swing in the onsets.",
]);
add("ground", null, ["feel:straight", "tempo:known"], long, [
  "The feel reads straight, so the images march or glide on the grid instead of leaning off it.",
  "Straight feel beside the BPM. The offbeat is not dragging, and the story will not pretend it is.",
]);

add("ground", null, ["key:named", "keyconf:firm", "mode:major"], short, [
  "{key}, and the confidence is high.",
  "The key holds: {key}.",
  "{key}. The center is clear.",
]);
add("ground", null, ["key:named", "keyconf:firm", "mode:major"], long, [
  "The key reads {key} with high confidence, a major center the windows agreed on.",
  "{key} is the home key, firm enough to name without a hedge.",
]);

add("ground", null, ["key:named", "keyconf:soft", "mode:major"], short, [
  "It leans toward {key}.",
  "{key}, with only a soft confidence.",
  "A major reading, hedged: {key}.",
]);
add("ground", null, ["key:named", "keyconf:soft", "mode:major"], long, [
  "The key leans {key}. Confidence is real and not high, so the name is a lean, not a stamp.",
  "{key} is the best major reading, and the wording stays soft because the confidence is soft.",
]);

add("ground", null, ["key:named", "keyconf:firm", "mode:minor"], short, [
  "{key}, held with high confidence.",
  "The minor center is {key}.",
  "{key}. The key is clear.",
]);
add("ground", null, ["key:named", "keyconf:firm", "mode:minor"], long, [
  "{key} is the home key, a minor center with confidence high enough to say plainly.",
  "The key reads {key}, and the minor color is the one the profile and the cadence agreed on.",
]);

add("ground", null, ["key:named", "keyconf:soft", "mode:minor"], short, [
  "It leans {key}.",
  "{key}, softly.",
  "A minor lean: {key}.",
]);
add("ground", null, ["key:named", "keyconf:soft", "mode:minor"], long, [
  "The reading leans {key}. Minor, and only as sure as the confidence allows, so the sentence stays a lean.",
  "{key} is the minor key on offer, with a confidence that asks for a soft verb.",
]);

add("ground", null, ["key:hidden"], short, [
  "Key unclear.",
  "The key stays unnamed.",
  "Key unclear. No center is claimed.",
  "A tonal color, and still Key unclear.",
]);
add("ground", null, ["key:hidden"], long, [
  "Key unclear. The harmony never sat still long enough, or clearly enough, to wear a name.",
  "There is pitch in places and no honest key. Key unclear, and the story will not borrow one.",
  "The key stays veiled. Key unclear is the measured result, so no note gets promoted.",
  "Below the line where a name is allowed, the key remains unclear.",
]);

add("section", null, ["section:Intro"], short, [
  "Intro at {start}, still under the later level.",
  "The intro occupies {start}–{end}.",
  "From {start}, an intro, quieter than what follows.",
]);
add("section", null, ["section:Intro"], long, [
  "The song map opens with an intro at {start}, the span that sits under the average of the rest.",
  "Intro, {start} to {end}: a quieter first room, which is all the word intro means here.",
  "From {start} the intro holds back. The level, not a title, is what marks it.",
]);

add("section", null, ["section:Build"], short, [
  "Build at {start}, level rising.",
  "The build runs {start}–{end}.",
  "A build from {start}, the rise before the jump.",
]);
add("section", null, ["section:Build"], long, [
  "The map marks a build at {start}, a span where the level climbs before the louder section.",
  "Build, {start} to {end}. The word means a measured rise, not a promised chorus.",
  "From {start} the build earns its name by getting louder inside the span.",
]);

add("section", null, ["section:Drop"], short, [
  "Drop at {start}, where the level jumps.",
  "The drop lands at {start}.",
  "A drop from {start} to {end}.",
]);
add("section", null, ["section:Drop"], long, [
  "The drop at {start} is the loudness jump on the map, the section that steps up and stays up.",
  "Drop, {start} to {end}: a higher average level than the section before it, which is the whole definition.",
  "At {start} the map calls a drop. The image can widen there. It cannot invent a chorus.",
]);

add("section", null, ["section:Section"], short, [
  "A section from {start} to {end}.",
  "Section at {start}, with no louder name.",
  "From {start}, a plain section.",
]);
add("section", null, ["section:Section"], long, [
  "The map keeps a plain section from {start} to {end}, a span without a jump large enough to rename.",
  "Section, {start}–{end}. No intro, build, or drop was earned there, so the story uses the plain word.",
  "From {start} the song simply continues, a section in the measured sense.",
]);

add("section", null, ["section:any"], short, [
  "{label} at {start}.",
  "{label}, {start}–{end}.",
  "The map says {label} from {start}.",
]);
add("section", null, ["section:any"], long, [
  "{label} runs {start} to {end}, one room on the song map and only as large as the level made it.",
  "At {start} the map enters {label}. The journey follows that order and does not rename the rooms.",
]);

add("arc", null, ["arc:slow-burn"], short, [
  "The arc is a slow burn.",
  "Level rises as the song goes.",
  "A slow burn: the peak comes late.",
]);
add("arc", null, ["arc:slow-burn"], long, [
  "The energy arc is a slow burn. The later third sits above the opening, and the peak is not in a hurry.",
  "Slow burn: loudness gathers across the timeline instead of spending itself at the door.",
  "The curve climbs. A slow burn, with the peak marked where the level finally arrives.",
  "It saves its height. The arc's shape is a slow burn toward the later part of the song.",
]);

add("arc", null, ["arc:early-peak"], short, [
  "The arc peaks early.",
  "Height first, then a coming down.",
  "An early peak, and a lower ending.",
]);
add("arc", null, ["arc:early-peak"], long, [
  "The energy arc peaks early. The opening third carries the height, and the ending gives some of it back.",
  "Early peak: the loudest stretch is near the front, so the journey afterward is a descent or a settling.",
  "The curve spends its loudest moment before the middle and does not get it back in full.",
  "An early peak on the arc. The story's excitement, if it has any, belongs near the start.",
]);

add("arc", null, ["arc:plateau"], short, [
  "The arc is a plateau.",
  "Level stays in a narrow band.",
  "A plateau: no dramatic climb or fall.",
]);
add("arc", null, ["arc:plateau"], long, [
  "The energy arc is a plateau. The thirds of the song sit near one another, so the drama is not in the contour.",
  "Plateau: loudness holds. The map can still change rooms, but the level does not stage a plot.",
  "The curve refuses a big rise or a big drop. A plateau is the honest shape.",
  "Across the timeline the level barely travels. The arc is a plateau.",
]);

add("arc", null, ["arc:late-drop"], short, [
  "The arc drops late.",
  "It holds, then the ending falls away.",
  "A late drop in level.",
]);
add("arc", null, ["arc:late-drop"], long, [
  "The energy arc holds and then falls. The last third is the quiet one, a late drop rather than a fade invented for effect.",
  "Late drop: the ending sits under the middle of the song, so the journey's last room is the softer one.",
  "The curve lets go near the end. That late drop is the shape, measured a third at a time.",
  "Height is spent before the close. The arc's last move is a drop in level.",
]);

add("measure", null, ["loud:quiet"], short, [
  "Integrated loudness is {lufs} LUFS, on the quiet side.",
  "{lufs} LUFS. Quiet, by the scale used here.",
  "A quiet master: {lufs} LUFS.",
]);
add("measure", null, ["loud:quiet"], long, [
  "Loudness sits at {lufs} LUFS integrated, quiet of the line this reading calls moderate.",
  "The master is quiet, {lufs} LUFS. The images can be near and small. They cannot shout.",
]);

add("measure", null, ["loud:moderate"], short, [
  "{lufs} LUFS, a moderate integrated level.",
  "Moderate loudness, {lufs} LUFS.",
  "The master sits at {lufs} LUFS.",
]);
add("measure", null, ["loud:moderate"], long, [
  "Integrated loudness is {lufs} LUFS, in the moderate band between a quiet master and a pushed one.",
  "{lufs} LUFS. Neither a whisper nor a brick wall, which is what moderate means here.",
]);

add("measure", null, ["loud:loud"], short, [
  "Loud master: {lufs} LUFS.",
  "{lufs} LUFS, on the loud side.",
  "Integrated level {lufs} LUFS.",
]);
add("measure", null, ["loud:loud"], long, [
  "The master is loud, {lufs} LUFS integrated, above the line this reading calls moderate.",
  "{lufs} LUFS. The picture can be bright and forward because the level actually is.",
]);

add("measure", null, ["dyn:flat"], short, [
  "Dynamics are narrow, a {span} LU span.",
  "Level span {span} LU. Little travel.",
  "A flat dynamic, {span} LU from quiet to loud.",
]);
add("measure", null, ["dyn:flat"], long, [
  "The level span is only {span} LU. Dynamics stay narrow, so the story's rises have to be small ones.",
  "A narrow dynamic range, {span} LU of span. The song does not travel far in loudness.",
]);

add("measure", null, ["dyn:moving"], short, [
  "Level span {span} LU.",
  "Dynamics move, about {span} LU of span.",
  "A living span: {span} LU.",
]);
add("measure", null, ["dyn:moving"], long, [
  "Dynamics have room, a level span of {span} LU, enough to feel the map change without calling it extreme.",
  "The span from the quieter moments to the louder ones is {span} LU. The contour can breathe.",
]);

add("measure", null, ["dyn:wide"], short, [
  "Wide dynamics, {span} LU of span.",
  "The level travels {span} LU.",
  "A wide span: {span} LU.",
]);
add("measure", null, ["dyn:wide"], long, [
  "Dynamics are wide, {span} LU between the quieter and louder stretches of the one-second curve.",
  "The level span is {span} LU. Contrast is a measurement here, not a compliment.",
]);

add("measure", null, ["low:light"], short, [
  "Low end is light, about {lowPct}% below 120 Hz.",
  "{lowPct}% of the energy sits under 120 Hz.",
  "A light low end, {lowPct}%.",
]);
add("measure", null, ["low:light"], long, [
  "The low end is light: about {lowPct}% of the spectral energy is below 120 Hz, under the share this reading calls balanced.",
  "Bass is not the mass of the track. {lowPct}% below 120 Hz, so the image stays off the floor.",
]);

add("measure", null, ["low:balanced"], short, [
  "Low end is balanced, near {lowPct}% below 120 Hz.",
  "{lowPct}% under 120 Hz.",
  "A balanced low end, {lowPct}%.",
]);
add("measure", null, ["low:balanced"], long, [
  "Low-end weight is balanced, about {lowPct}% of the energy below 120 Hz, neither a whisper of bass nor a flood.",
  "{lowPct}% sits under 120 Hz. The floor of the picture is present and not in charge.",
]);

add("measure", null, ["low:heavy"], short, [
  "Low end is heavy, about {lowPct}% below 120 Hz.",
  "{lowPct}% of the energy is under 120 Hz.",
  "A heavy low end, {lowPct}%.",
]);
add("measure", null, ["low:heavy"], long, [
  "The low end carries real weight: about {lowPct}% of the spectral energy is below 120 Hz.",
  "Bass is a large share of the picture, {lowPct}% under 120 Hz, which is the heavy band in this reading.",
]);

add("measure", null, ["width:mono"], short, [
  "The image is mono.",
  "Width reads mono.",
  "A mono field, correlation near the center.",
]);
add("measure", null, ["width:mono"], long, [
  "Stereo width reads mono. The two sides agree, so the picture has no invented panorama.",
  "The field is mono. Any closeness in the story is allowed to be literal.",
]);

add("measure", null, ["width:narrow"], short, [
  "The stereo image is narrow.",
  "Width reads narrow.",
  "A narrow field, not a panorama.",
]);
add("measure", null, ["width:narrow"], long, [
  "Width is narrow. The sides are related without opening into a wide image, so the frame stays gathered.",
  "The stereo reading is narrow. The picture can be deep and still not be wide.",
]);

add("measure", null, ["width:wide"], short, [
  "The image is wide.",
  "Width reads wide.",
  "A wide stereo field.",
]);
add("measure", null, ["width:wide"], long, [
  "Stereo width reads wide, enough side energy or separation that the frame is allowed to be panoramic.",
  "The field is wide. The opening can talk about distance because the sides actually disagree a little.",
]);

add("change", null, ["changes:yes", "key:named"], short, [
  "The key moves to {changeLabel} at {changeAt}.",
  "A change: {changeLabel}, at {changeAt}.",
  "{changeLabel} arrives at {changeAt}.",
]);
add("change", null, ["changes:yes", "key:named"], long, [
  "The home key does not keep the whole song. At {changeAt} the reading shifts to {changeLabel}.",
  "One key change is firm enough to timestamp: {changeLabel} at {changeAt}.",
  "The map of harmony bends at {changeAt}, into {changeLabel}, and the journey should pass that door.",
]);

add("change", null, ["changes:no"], short, [
  "No key change is marked.",
  "The key, if it has a name, stays home.",
  "Harmony does not stage a move.",
]);
add("change", null, ["changes:no"], long, [
  "No key change cleared the bar, so the story keeps a single center and does not invent a modulation.",
  "The windows did not agree on a second key. There is no timestamped change to honor.",
]);

add("vocal", null, ["vocals:yes"], short, [
  "The artist reported vocals.",
  "Vocals: yes, and only because the artist said so.",
  "Artist-reported vocals. Nothing here was detected.",
]);
add("vocal", null, ["vocals:yes"], long, [
  "The artist reported that this track has vocals. That is a label they chose, not a measurement the audio made.",
  "Vocals are artist-reported, a yes with no detector behind it. The story may mention the report and nothing more.",
]);

add("vocal", null, ["vocals:no"], short, [
  "The artist reported no vocals.",
  "Vocals: no, artist-reported.",
  "Marked instrumental by the artist.",
]);
add("vocal", null, ["vocals:no"], long, [
  "The artist reported no vocals. The track is treated as instrumental because they said so, not because a model listened.",
  "No vocals, and the source of that claim is the artist. The story will not add a singer.",
]);

add("close", null, ["moment:opening"], short, [
  "The moment is the loudest 8 seconds, at {moment}, in the opening.",
  "The moment falls in the opening, {moment}.",
  "{dur}s at {moment}, where the song has barely begun.",
]);
add("close", null, ["moment:opening"], long, [
  "The moment, the loudest 8 seconds of K-weighted power, starts at {moment}, still in the opening of the song.",
  "Close on the moment: {dur} seconds from {moment}, early enough that the peak of power is an opening image.",
  "The journey ends where the power was highest, and that place is the opening, at {moment}.",
]);

add("close", null, ["moment:early"], short, [
  "The moment sits early, at {moment}.",
  "Loudest 8 seconds: {moment}, in the early part.",
  "The moment is early, {dur}s from {moment}.",
]);
add("close", null, ["moment:early"], long, [
  "The moment is the loudest 8 seconds, starting at {moment}, early in the song rather than at its crown.",
  "Power peaks early. The moment runs {dur} seconds from {moment}, and the close of the story belongs there.",
  "The clip-worthy span, by level alone, is early: {moment}, for {dur} seconds.",
]);

add("close", null, ["moment:middle"], short, [
  "The moment is in the middle, at {moment}.",
  "Mid-song, the loudest 8 seconds start at {moment}.",
  "The moment holds the middle, from {moment}.",
]);
add("close", null, ["moment:middle"], long, [
  "The moment falls in the middle, {dur} seconds from {moment}, the stretch where K-weighted power averages highest.",
  "The close is the middle of the song: the loudest 8 seconds begin at {moment}.",
  "Not the door and not the ending. The moment sits mid-map, at {moment}.",
]);

add("close", null, ["moment:late"], short, [
  "The moment comes late, at {moment}.",
  "Late in the song, the loudest 8 seconds start at {moment}.",
  "The moment is late: {moment}.",
]);
add("close", null, ["moment:late"], long, [
  "The moment arrives late, the loudest 8 seconds starting at {moment}, after most of the map has already been walked.",
  "Power saves its average for late in the song. The moment is {dur} seconds from {moment}.",
  "The close belongs near the end of the map: {moment}, where the level's 8-second average wins.",
]);

add("close", null, ["moment:ending"], short, [
  "The moment is at the ending, {moment}.",
  "The loudest 8 seconds close the song, from {moment}.",
  "An ending moment, at {moment}.",
]);
add("close", null, ["moment:ending"], long, [
  "The moment is the ending itself, {dur} seconds from {moment}, the last place the power average wins.",
  "The song's loudest 8 seconds are the ending, starting at {moment}. The story closes on that fact.",
  "Nothing later outranks it. The moment sits at the ending, {moment}.",
]);

add("close", null, ["moment:none"], short, [
  "No moment is marked.",
  "There is no 8-second peak to point at.",
  "The moment stays unmarked.",
]);
add("close", null, ["moment:none"], long, [
  "No moment is marked. The timeline never offered an 8-second span to call the loudest.",
  "The close has no clip to name. The moment is absent, and the story will not invent a highlight.",
]);

export const STORY_FRAGMENTS: readonly StoryFragment[] = library;
