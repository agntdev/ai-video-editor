import { Composer } from "grammy";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Add background music", data: "overlay:music" }) if the toolkit exposes it.

const composer = new Composer();

composer.callbackQuery("overlay:music", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Add background music to the current project");
});

export default composer;
