import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject, saveProject } from "../store.js";

registerMainMenuItem({ label: "✂️ Add cut", data: "cut:add", order: 30 });

const composer = new Composer<Ctx>();

const TIMESTAMP_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

function parseTimestamp(raw: string): string | null {
  const m = TIMESTAMP_RE.exec(raw.trim());
  if (!m) return null;
  return raw.trim();
}

composer.callbackQuery("cut:add", async (ctx) => {
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

  ctx.session.step = "awaiting_cut_start";
  await ctx.reply(
    "Send the cut start timestamp.\n\nFormat: MM:SS or HH:MM:SS\nExample: 0:30",
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_cut_start") return next();

  const text = ctx.message.text.trim();
  const ts = parseTimestamp(text);
  if (!ts) {
    await ctx.reply("Invalid format — use MM:SS or HH:MM:SS\n\nExample: 0:30 or 1:05:30");
    return;
  }

  ctx.session.cutStart = ts;
  ctx.session.step = "awaiting_cut_end";
  await ctx.reply(`Start: ${ts}\n\nNow send the end timestamp.`);
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_cut_end") return next();

  const text = ctx.message.text.trim();
  const ts = parseTimestamp(text);
  if (!ts) {
    await ctx.reply("Invalid format — use MM:SS or HH:MM:SS\n\nExample: 1:30");
    return;
  }

  const startTs = ctx.session.cutStart;
  if (!startTs) {
    ctx.session.step = "idle";
    await ctx.reply("Something went wrong — try adding the cut again.");
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

  project.cuts.push({ start: startTs, end: ts });
  project.updatedAt = Date.now();
  await saveProject(chatId, project);

  ctx.session.cutStart = undefined;
  ctx.session.step = "idle";

  await ctx.reply(`✅ Cut added: ${startTs} → ${ts}\n\nTotal cuts: ${project.cuts.length}`, {
    reply_markup: inlineKeyboard([
      [inlineButton("✂️ Add another cut", "cut:add")],
      [inlineButton("👁 Preview cuts", "cut:preview")],
      [inlineButton("📤 Export", "export:start")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
