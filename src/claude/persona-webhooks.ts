import type { TextChannel, Webhook } from "discord.js";
import { splitMessage } from "./output-formatter.js";

// Maps a project's .claude/agents/*.md `name:` frontmatter to how it should
// appear in Discord when it "speaks" via webhook (separate username/avatar
// from the main bot, so a multi-agent debate reads like a real conversation).
export const PERSONA_DISPLAY: Record<string, { name: string; avatarURL?: string }> = {
  "doc-writer": { name: "김문서 · 문서작성자" },
  "fire-equipment-expert": { name: "김장비 · 소방용품전문가" },
  "ul-certification-expert": { name: "김유엘 · UL인증전문가" },
  "fire-protection-engineer": { name: "김공학 · 소방기술사" },
};

const WEBHOOK_NAME = "Agent Team";
const webhookCache = new Map<string, Webhook>();

async function getOrCreateWebhook(channel: TextChannel): Promise<Webhook | null> {
  const cached = webhookCache.get(channel.id);
  if (cached) return cached;

  try {
    const existing = await channel.fetchWebhooks();
    const own = existing.find(
      (w) => w.name === WEBHOOK_NAME && w.owner?.id === channel.client.user?.id,
    );
    if (own) {
      webhookCache.set(channel.id, own);
      return own;
    }
    const created = await channel.createWebhook({ name: WEBHOOK_NAME });
    webhookCache.set(channel.id, created);
    return created;
  } catch (e) {
    console.warn(`[persona-webhook] Could not get/create webhook for #${channel.id} (missing "Manage Webhooks" permission?):`, e instanceof Error ? e.message : e);
    return null;
  }
}

// Posts `text` as if the given subagent persona said it. Falls back to a
// plain prefixed message on the bot's own account if webhooks are unavailable
// (e.g. missing permission), so a debate is never silently dropped.
export async function sendPersonaMessage(
  channel: TextChannel,
  subagentType: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const persona = PERSONA_DISPLAY[subagentType] ?? { name: subagentType };
  const chunks = splitMessage(trimmed);

  const webhook = await getOrCreateWebhook(channel);
  for (const chunk of chunks) {
    if (webhook) {
      try {
        await webhook.send({
          content: chunk,
          username: persona.name,
          avatarURL: persona.avatarURL,
        });
        continue;
      } catch (e) {
        console.warn(`[persona-webhook] Send failed for ${subagentType}, falling back to bot message:`, e instanceof Error ? e.message : e);
      }
    }
    await channel.send(`**${persona.name}**\n${chunk}`);
  }
}
