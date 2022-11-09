import { AuditLogEvent, Message, PartialMessage, User } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { constants } from "../common/constants.js";
import { embedFactory, sleep } from "../common/utils.js";

@Discord()
export class MessageDelete {
  @On()
  async messageDelete([message]: ArgsOf<"messageDelete">): Promise<void> {
    if (message.author?.bot) {
      return;
    }
    
    const userId = process.env.MAHER;

    if (!userId) {
      console.error(`No User ID defined in .env for direct messages.`);
      return;
    }

    const executor = await this._retrieveExecutor(message);

    const embed = embedFactory({
      title: message.guild?.name ?? '',
      color: "Red",
    })
    .addFields([
      { name: 'Sender', value: message.author?.toString() ?? '' },
      { name: 'Deleted By', value: `${executor?.toString() ?? "N/A"}` },
      { name: 'Content', value: message.content ?? '' },
    ])
    .setAuthor({
      name: message.author?.username ?? '',
      iconURL: message.author ? `${constants.DISCORD_CDN_AVATAR_URL}/${message.author.id}/${message.author.avatar}` : ''
    })

    try {
      const user = message.client.users.cache.get(userId);
      await user?.send({ embeds: [embed, ...message.embeds] });
    } catch (e) {
      console.error(`Could not send a DM to ${userId}.`);
    }
  }

  private async _retrieveExecutor(
    message: Message<boolean> | PartialMessage
  ): Promise<User | null> {
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
        Date.now() - entry.createdTimestamp < 20000
    );

    if (!entry) {
      console.error(`Could not find a matching audit log entry.`);
      return null;
    }

    return entry.executor ?? null;
  }
}
