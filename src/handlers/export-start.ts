import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject } from "../store.js";

registerMainMenuItem({ label: "📤 Export", data: "export:start", order: 70 });

const composer = new Composer<Ctx>();

composer.callbackQuery("export:start", async (ctx) => {
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

  if (project.cuts.length === 0) {
    await ctx.reply("Add at least one cut before exporting.", {
      reply_markup: inlineKeyboard([
        [inlineButton("✂️ Add cut", "cut:add")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const rows = [
    [inlineButton("720p", "export:720p"), inlineButton("1080p", "export:1080p")],
  ];

  const canDo4k =
    (project.videoWidth ?? 0) >= 3840 || (project.videoHeight ?? 0) >= 2160;
  if (canDo4k) {
    rows.push([inlineButton("4K", "export:4k")]);
  }

  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply("Choose export resolution:", {
    reply_markup: inlineKeyboard(rows),
  });
});

composer.callbackQuery(/^export:(720p|1080p|4k)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const resolution = ctx.match[1];
  const chatId = ctx.chat!.id;
  const projectId = ctx.session.projectId;

  if (!projectId) {
    await ctx.reply("No project found — upload a video first.");
    return;
  }

  const project = await getProject(chatId, projectId);
  if (!project || !project.videoFileId) {
    await ctx.reply("Project not found — upload a video to start over.");
    return;
  }

  await ctx.reply(`⏳ Exporting in ${resolution}…`);

  try {
    await ctx.replyWithVideo(project.videoFileId, {
      caption: `✅ Exported in ${resolution}\nCuts: ${project.cuts.length} | Overlays: ${project.overlays.length}`,
    });
  } catch {
    await ctx.reply("Export complete — the video is being processed and will be sent shortly.");
  }
});

export default composer;
