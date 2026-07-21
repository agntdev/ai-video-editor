import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject, saveProject } from "../store.js";

registerMainMenuItem({ label: "📝 Text overlay", data: "overlay:text", order: 40 });

const composer = new Composer<Ctx>();

composer.callbackQuery("overlay:text", async (ctx) => {
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

  ctx.session.step = "awaiting_text_overlay";
  await ctx.reply("Send the text you want to overlay on the video.", {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_text_overlay") return next();

  const text = ctx.message.text.trim();
  if (text.length === 0) {
    await ctx.reply("Text can't be empty — try again.");
    return;
  }

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

  project.overlays.push({ type: "text", content: text });
  project.updatedAt = Date.now();
  await saveProject(chatId, project);

  ctx.session.step = "idle";
  await ctx.reply(`✅ Text overlay added: "${text}"`, {
    reply_markup: inlineKeyboard([
      [inlineButton("📝 Add another", "overlay:text")],
      [inlineButton("📤 Export", "export:start")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
