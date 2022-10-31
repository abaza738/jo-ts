import { AuditLogEvent, Message, PartialMessage } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { embedFactory, sleep } from "../common/utils.js";

@Discord()
export class MessageDelete {
  @On()
  async messageDelete([message]: ArgsOf<"messageDelete">): Promise<void> {
    const userId = process.env.MAHER;

    if (!userId) {
      console.error(`No User ID defined in .env for direct messages.`);
      return;
    }

    const executor = await this._retrieveExecutor(message);

    const embed = embedFactory({
      title: `\`messageDelete\` event report`,
      description: `Server: **${message.guild?.name}**\nDeleted by: **${executor ?? "-"}**`,
      color: "Red",
    });

    if (message.content) {
      embed.addFields([
        { name: "Content", value: `\`\`\`\n${message.content}\`\`\`` },
      ]);
    }

    try {
      const user = message.client.users.cache.get(userId);
      await user?.send({ embeds: [embed, ...message.embeds] });
    } catch (e) {
      console.error(`Could not send a DM to ${userId}.`);
    }
  }

  private async _retrieveExecutor(
    message: Message<boolean> | PartialMessage
  ): Promise<string | null> {
    await sleep(1000);
    let logs;

    try {
      logs = await message.guild?.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MessageDelete,
      });
    } catch (e) {
      console.error(`Error fetching logs.`);
      return null;
    }

    if (!logs) {
      console.error(`Could not fetch any related audit logs.`);
      return null;
    }

    const entry = logs.entries.find(
      (entry) =>
        entry.target.id === message.author?.id &&
        entry.extra.channel.id === message.channel.id &&
        Date.now() - entry.createdTimestamp < 10000
    );

    if (!entry) {
      console.error(`Could not find a matching audit log entry.`);
      return null;
    }

    return entry.executor?.tag ?? null;
  }
}
