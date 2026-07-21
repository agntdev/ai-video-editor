import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject, saveProject } from "../store.js";

registerMainMenuItem({ label: "🎵 Music", data: "overlay:music", order: 60 });

const composer = new Composer<Ctx>();

composer.callbackQuery("overlay:music", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat!.id;
  const projectId = ctx.session.projectId;

  if (!projectId) {
    await ctx.reply("Upload a video first to start editing.", {
      reply_markup: inlineKeyboard([
        [inlineButton("📹 Upload video", "video:upload")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const project = await getProject(chatId, projectId);
  if (!project) {
    ctx.session.projectId = undefined;
    await ctx.reply("Project not found — upload a video to start over.");
    return;
  }

  ctx.session.step = "awaiting_music";
  await ctx.reply("Send an audio file for background music.", {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.on("message:audio", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_music") return next();

  const audio = ctx.message.audio;
  const chatId = ctx.chat!.id;
  const projectId = ctx.session.projectId;
  if (!projectId) {
    ctx.session.step = "idle";
    await ctx.reply("No project found — upload a video first.");
    return;
  }

  const project = await getProject(chatId, projectId);
  if (!project) {
    ctx.session.projectId = undefined;
    ctx.session.step = "idle";
    await ctx.reply("Project not found — upload a video to start over.");
    return;
  }

  project.overlays.push({ type: "music", content: audio.file_id });
  project.updatedAt = Date.now();
  await saveProject(chatId, project);

  ctx.session.step = "idle";
  await ctx.reply("✅ Background music added.", {
    reply_markup: inlineKeyboard([
      [inlineButton("📤 Export", "export:start")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
