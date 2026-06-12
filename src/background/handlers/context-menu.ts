import { registerCoachContextMenus } from "@/background/context-menu";
import { registerHandler } from "@/shared/messaging/router";

registerHandler("REFRESH_CONTEXT_MENUS", async () => {
  await registerCoachContextMenus();
  return { ok: true, data: null };
});
