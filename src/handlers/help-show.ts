import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP_TEXT = [
  "🎬 AI Video Editor — How to use",
  "",
  "1. Upload a video from the main menu",
  "2. Add cuts with precise timestamps",
  "3. Add text, watermarks, or background music",
  "4. Preview cuts before exporting",
  "5. Export in 720p, 1080p, or 4K",
  "",
  "Your projects are saved — come back anytime to continue.",
].join("\n");

composer.callbackQuery("help:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(HELP_TEXT, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
