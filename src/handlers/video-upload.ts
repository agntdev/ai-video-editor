import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProjects, saveProject, generateProjectId, type Project } from "../store.js";

registerMainMenuItem({ label: "📹 Upload video", data: "video:upload", order: 10 });

const composer = new Composer<Ctx>();

const SUPPORTED_FORMATS = "MP4, MKV, MOV, AVI, WebM.";

composer.callbackQuery("video:upload", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_video";
  await ctx.reply(
    `Send me a video to start editing.\n\nSupported formats: ${SUPPORTED_FORMATS}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.on("message:video", async (ctx) => {
  const video = ctx.message.video;
  const chatId = ctx.chat.id;

  const project: Project = {
    id: generateProjectId(),
    chatId,
    videoFileId: video.file_id,
    fileName: video.file_name ?? "video.mp4",
    videoWidth: video.width,
    videoHeight: video.height,
    cuts: [],
    overlays: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProject(chatId, project);
  ctx.session.projectId = project.id;
  ctx.session.step = "idle";

  await ctx.reply(
    "✅ Video saved! Project created.\n\nYou can now add cuts, overlays, or export.",
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton("✂️ Add cut", "cut:add"),
          inlineButton("📝 Text", "overlay:text"),
        ],
        [
          inlineButton("🖼 Watermark", "overlay:watermark"),
          inlineButton("🎵 Music", "overlay:music"),
        ],
        [inlineButton("📤 Export", "export:start")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

export default composer;
