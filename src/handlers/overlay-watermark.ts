import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject, saveProject } from "../store.js";

registerMainMenuItem({ label: "🖼 Watermark", data: "overlay:watermark", order: 50 });

const composer = new Composer<Ctx>();

composer.callbackQuery("overlay:watermark", async (ctx) => {
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

  ctx.session.step = "awaiting_watermark";
  await ctx.reply("Send an image to use as a watermark.", {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.on("message:photo", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_watermark") return next();

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  if (!photo) return next();

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

  project.overlays.push({ type: "watermark", content: photo.file_id });
  project.updatedAt = Date.now();
  await saveProject(chatId, project);

  ctx.session.step = "idle";
  await ctx.reply("✅ Watermark added.", {
    reply_markup: inlineKeyboard([
      [inlineButton("📤 Export", "export:start")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
