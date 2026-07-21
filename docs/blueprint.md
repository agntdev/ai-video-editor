# AI Video Editor — Bot specification

**Archetype:** workflow

**Voice:** warm and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that lets casual users upload videos, cut them at precise timestamps, add text/watermarks/music, and export in HD/4K quality. Projects persist across sessions and completed exports are stored temporarily before cleanup.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Casual users editing personal videos

## Success criteria

- User uploads a video, adds cuts, exports, and receives the edited video back
- User can resume editing a saved project in a later session
- User can preview cuts before exporting
- User can add text, watermark, or background music to a project
- User can choose export resolution (720p/1080p/4K) and export
- Completed exports are stored temporarily (7 days) before cleanup

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **Upload video** (button, actor: user, callback: video:upload) — Upload a video to create a new project
  - inputs: video file
  - outputs: project created, video saved, project opened
- **Resume project** (button, actor: user, callback: project:resume) — Resume editing a saved project
  - outputs: project list shown, project opened
- **Add cut** (button, actor: user, callback: cut:add) — Add a cut to the current project
  - inputs: start timestamp, end timestamp
  - outputs: cut added, cut previewable
- **Add text overlay** (button, actor: user, callback: overlay:text) — Add a text overlay to the current project
  - inputs: text
  - outputs: text overlay added
- **Add watermark** (button, actor: user, callback: overlay:watermark) — Add a watermark overlay to the current project
  - inputs: watermark image
  - outputs: watermark added
- **Add background music** (button, actor: user, callback: overlay:music) — Add background music to the current project
  - inputs: music file
  - outputs: background music added
- **Preview cut** (button, actor: user, callback: cut:preview) — Preview a cut before exporting
  - inputs: cut index
  - outputs: cut preview sent
- **Export video** (button, actor: user, callback: export:start) — Export the current project
  - inputs: resolution
  - outputs: export started, progress updates sent, video delivered
- **Help** (button, actor: user, callback: help:show) — Show help information
  - outputs: help shown

## Flows

### Upload video
_Trigger:_ User sends video to bot

1. Video saved
2. Project created
3. Project opened

_Data touched:_ Project, Video

### Add cut
_Trigger:_ User types start/end timestamps

1. Cut added
2. Cut previewable

_Data touched:_ Cut

### Add text overlay
_Trigger:_ User sends text

1. Text overlay added

_Data touched:_ Overlay

### Add watermark
_Trigger:_ User sends watermark image

1. Watermark added

_Data touched:_ Overlay

### Add background music
_Trigger:_ User sends music file

1. Background music added

_Data touched:_ Overlay

### Preview cut
_Trigger:_ User selects cut to preview

1. Cut preview sent

_Data touched:_ Cut

### Export video
_Trigger:_ User chooses resolution and exports

1. Export started
2. Progress updates sent
3. Video delivered

_Data touched:_ Project, Export

### Resume project
_Trigger:_ User selects project to resume

1. Project list shown
2. Project opened

_Data touched:_ Project

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Project** _(retention: persistent)_ — Uploaded video + list of cuts + overlays + export settings
  - fields: video_id, cuts, overlays, export_settings, created_at, updated_at
- **Cut** _(retention: session)_ — Start/end timestamp, previewable before export
  - fields: start_timestamp, end_timestamp, preview_url
- **Overlay** _(retention: session)_ — Text, logo/watermark image, background music file
  - fields: type, content, position, opacity
- **Export** _(retention: session)_ — Exported video file
  - fields: video_id, resolution, created_at, expires_at

## Integrations

- **Telegram** (required) — Bot API messaging
- **Video processing** (required) — Cut, overlay, and export video
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- View project list
- Delete project
- Clear completed exports
- View export history

## Notifications

- Export started
- Export in progress
- Export completed
- Export failed

## Permissions & privacy

- User uploads video
- Bot saves video temporarily
- Bot sends export back to user
- Completed exports stored temporarily (7 days) before cleanup

## Edge cases

- User uploads unsupported video format
- User enters invalid timestamps
- User tries to export without cuts
- User tries to export without video
- User tries to add overlay without video
- User tries to preview cut without cuts
- User tries to resume project without saved projects
- User tries to export with unsupported resolution

## Required tests

- User uploads a video, adds cuts, exports, and receives the edited video back
- User can resume editing a saved project in a later session
- User can preview cuts before exporting
- User can add text, watermark, or background music to a project
- User can choose export resolution (720p/1080p/4K) and export
- Completed exports are stored temporarily (7 days) before cleanup

## Assumptions

- Supported formats: MP4, MKV, MOV, AVI, WebM
- Export resolutions: 720p and 1080p always available; 4K only if the original video supports it
- Thumbnail generation: bot auto-generates one from the first frame; user can upload a custom image to replace it
- Project storage: saved in Telegram's internal storage (no external database needed)
- Export order: sequential processing queue
