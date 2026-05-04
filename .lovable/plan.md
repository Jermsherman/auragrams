## Problem

On mobile (393px viewport), Dialog modals like Share AuraLink overflow the screen. The default `DialogContent` uses `max-w-lg` (~512px) with no horizontal margin, so the dialog gets pushed off-center, content clips ("Share Au…", "Saved i…", "Share vi…"), and the X button collides with the title. The same issue affects Auracle Share, Story Preview, Add to Auracle, and Identity Selector dialogs.

## Fix

Make all dialogs mobile-first: smaller max width, side padding via `inset` so they never touch screen edges, and tighter inner spacing so modules feel compact and centered.

### 1. `src/components/ui/dialog.tsx` — base DialogContent

Update the default classes so every dialog in the app inherits proper mobile sizing:

- Replace `w-full max-w-lg` with `w-[calc(100%-2rem)] max-w-md` so there's always 1rem of breathing room on each side.
- Reduce default padding from `p-6` to `p-5` for tighter mobile feel (desktop still looks balanced).
- Keep the centered translate transform.

This single change fixes overflow for every Dialog instance globally.

### 2. `src/components/ShareDialog.tsx`

- Tighten `DialogContent` further: add `sm:max-w-sm` so even on desktop it stays compact and centered.
- Reduce inner button heights from `h-12` → `h-11` and `h-11` → `h-10` for the Story Preview / device-share rows so the stack feels lighter.
- Ensure the URL row truncates correctly (already `truncate`, but verify with smaller container).
- Hide the duplicate close X (Radix already renders one in top-right) — currently the DialogHeader has no extra X, so just confirm.

### 3. `src/components/AuracleShareDialog.tsx`

- Same `sm:max-w-sm` constraint and tightened button heights to match.

### 4. `src/components/StoryPreviewDialog.tsx` and `src/components/AuracleStoryDialog.tsx`

- Already use `max-w-sm p-5` — keep, but switch to `w-[calc(100%-2rem)] max-w-sm` so they still inset on tiny screens.

### 5. `src/components/AddToAuracleDialog.tsx` and `src/components/IdentitySelector.tsx` (if dialog-based)

- Inherit the new base; spot-check inner padding and button heights for consistency.

## Result

Every dialog renders centered, with comfortable side padding, no clipped text, and a smaller, more focused footprint on mobile — matching Apple-glass minimal feel.