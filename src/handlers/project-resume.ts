import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProjects, getProject } from "../store.js";

registerMainMenuItem({ label: "📂 My projects", data: "project:resume", order: 20 });

const composer = new Composer<Ctx>();

composer.callbackQuery("project:resume", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat!.id;
  const projects = await getProjects(chatId);

  if (projects.length === 0) {
    await ctx.reply("No saved projects yet — upload a video to create one.", {
      reply_markup: inlineKeyboard([
        [inlineButton("📹 Upload video", "video:upload")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const rows = projects.map((p) => {
    const label = p.fileName ?? `Project ${p.id.slice(0, 6)}`;
    return [inlineButton(`📂 ${label}`, `project:open:${p.id}`)];
  });
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply("Your projects:", {
    reply_markup: inlineKeyboard(rows),
  });
});

composer.callbackQuery(/^project:open:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat!.id;
  const projectId = ctx.match[1];
  const project = await getProject(chatId, projectId);

  if (!project) {
    await ctx.reply("Project not found — it may have been deleted.");
    return;
  }

  ctx.session.projectId = project.id;
  ctx.session.step = "idle";

  const cutCount = project.cuts.length;
  const overlayCount = project.overlays.length;
  const lines = [
    `📂 ${project.fileName ?? "Untitled"}`,
    `✂️ ${cutCount} cut${cutCount !== 1 ? "s" : ""}`,
    `🎨 ${overlayCount} overlay${overlayCount !== 1 ? "s" : ""}`,
  ];

  await ctx.reply(lines.join("\n"), {
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
  });
});

export default composer;
