import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProject } from "../store.js";

registerMainMenuItem({ label: "👁 Preview cuts", data: "cut:preview", order: 35 });

const composer = new Composer<Ctx>();

composer.callbackQuery("cut:preview", async (ctx) => {
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
  if (!project || project.cuts.length === 0) {
    await ctx.reply("No cuts to preview yet — add a cut first.", {
      reply_markup: inlineKeyboard([
        [inlineButton("✂️ Add cut", "cut:add")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const lines = project.cuts.map(
    (c, i) => `${i + 1}. ${c.start} → ${c.end}`,
  );
  await ctx.reply(`✂️ Cuts:\n${lines.join("\n")}`, {
    reply_markup: inlineKeyboard([
      [inlineButton("✂️ Add cut", "cut:add")],
      [inlineButton("📤 Export", "export:start")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
