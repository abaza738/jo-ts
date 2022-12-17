import { Player, Queue } from "@discordx/music";
import { Pagination, PaginationResolver, PaginationType } from "@discordx/pagination";
import {
  ActionRowBuilder,
  ButtonBuilder, ButtonStyle,
  Client,
  CommandInteraction,
  ContextMenuCommandInteraction, EmbedBuilder, Guild, Message, MessageActionRowComponentBuilder,
  MessageCreateOptions,
  MessageEditOptions,
  TextBasedChannel
} from "discord.js";
import { embedFactory } from "./utils.js";

export class MyQueue extends Queue {
  lastControlMessage?: Message;
  timeoutTimer?: NodeJS.Timeout;
  lockUpdate = false;

  get playbackMilliseconds(): number {
    const track = this.currentTrack;
    if (
      !track ||
      !track.metadata.isYoutubeTrack() ||
      !track.metadata.info.duration
    ) {
      return 0;
    }

    return this.toMS(track.metadata.info.duration);
  }

  constructor(player: Player, guild: Guild, public channel?: TextBasedChannel) {
    super(player, guild);
    setInterval(() => this.updateControlMessage(), 1e4);
    // empty constructor
  }

  public fromMS(duration: number): string {
    const seconds = Math.floor((duration / 1e3) % 60);
    const minutes = Math.floor((duration / 6e4) % 60);
    const hours = Math.floor(duration / 36e5);
    const secondsPad = `${seconds}`.padStart(2, "0");
    const minutesPad = `${minutes}`.padStart(2, "0");
    const hoursPad = `${hours}`.padStart(2, "0");
    return `${hours ? `${hoursPad}:` : ""}${minutesPad}:${secondsPad}`;
  }

  public toMS(duration: string): number {
    const milliseconds =
      duration
        .split(":")
        .reduceRight(
          (prev, curr, i, arr) =>
            prev + parseInt(curr) * Math.pow(60, arr.length - 1 - i),
          0
        ) * 1e3;

    return milliseconds ? milliseconds : 0;
  }

  private controlsRow(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const nextButton = new ButtonBuilder()
      .setLabel("Next")
      .setEmoji("⏭")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!this.isPlaying)
      .setCustomId("btn-next");
    const pauseButton = new ButtonBuilder()
      .setLabel(this.isPlaying ? "Pause" : "Resume")
      .setEmoji(this.isPlaying ? "⏸️" : "▶️")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("btn-pause");
    const stopButton = new ButtonBuilder()
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger)
      .setCustomId("btn-leave");
    const repeatButton = new ButtonBuilder()
      .setLabel("Repeat")
      .setEmoji("🔂")
      .setDisabled(!this.isPlaying)
      .setStyle(this.repeat ? ButtonStyle.Danger : ButtonStyle.Primary)
      .setCustomId("btn-repeat");
    const loopButton = new ButtonBuilder()
      .setLabel("Loop")
      .setEmoji("🔁")
      .setDisabled(!this.isPlaying)
      .setStyle(this.loop ? ButtonStyle.Danger : ButtonStyle.Primary)
      .setCustomId("btn-loop");

    const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      stopButton,
      pauseButton,
      nextButton,
      repeatButton,
      loopButton
    );

    const queueButton = new ButtonBuilder()
      .setLabel("Queue")
      .setEmoji("🎵")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("btn-queue");
    const mixButton = new ButtonBuilder()
      .setLabel("Shuffle")
      .setEmoji("🎛️")
      .setDisabled(!this.isPlaying)
      .setStyle(ButtonStyle.Primary)
      .setCustomId("btn-mix");
    const controlsButton = new ButtonBuilder()
      .setLabel("Controls")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("btn-controls");

    const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      queueButton,
      mixButton,
      controlsButton
    );
    return [row1, row2];
  }

  public async updateControlMessage(options?: {
    force?: boolean;
    text?: string;
  }): Promise<void> {
    if (this.lockUpdate) {
      return;
    }
    this.lockUpdate = true;
    const embed = new EmbedBuilder();
    embed.setTitle("Music Controls");
    const currentTrack = this.currentTrack;
    const nextTrack = this.nextTrack;
    if (!currentTrack) {
      if (this.lastControlMessage) {
        await this.lastControlMessage?.delete();
        this.lastControlMessage = undefined;
      }
      this.lockUpdate = false;
      return;
    }
    const user = currentTrack.metadata.isYoutubeTrack()
      ? currentTrack.metadata.options?.user
      : currentTrack.metadata?.user;
    embed.addFields({
      name: "Now Playing" + (this.size > 2 ? ` (Total: ${this.size} tracks queued)` : ""),
      value: `[${currentTrack.metadata.title}](${currentTrack.metadata.url ?? "NaN"})${ user ? ` by ${user}` : "" }`
    });

    const progressBaroptions = {
      size: 15,
      arrow: "🔘",
      block: "━",
    };

    if (currentTrack.metadata.isYoutubeTrack()) {
      const { size, arrow, block } = progressBaroptions;
      const timeNow = this.playbackDuration;
      const timeTotal = this.playbackMilliseconds;

      const progress = Math.round((size * timeNow) / timeTotal);
      const emptyProgress = size - progress;

      const progressString =
        block.repeat(progress) + arrow + block.repeat(emptyProgress);

      const bar = (this.isPlaying ? "▶️" : "⏸️") + " " + progressString;
      const currentTime = this.fromMS(timeNow);
      const endTime = this.fromMS(timeTotal);
      let spacing = bar.length - currentTime.length - endTime.length;
      if (typeof spacing !== "number" || spacing <= 0) {
        spacing = 1;
      }
      const time =
        "`" + currentTime + " ".repeat(spacing * 3 - 2) + endTime + "`";

      embed.addFields({
        name: bar,
        value: time
      });
    }

    if (
      currentTrack.metadata.isYoutubeTrack() &&
      currentTrack.metadata.info.bestThumbnail.url
    ) {
      embed.setThumbnail(currentTrack.metadata.info.bestThumbnail.url);
    }

    embed.addFields({
      name: "Next Song",
      value: nextTrack ? `[${nextTrack.title}](${nextTrack.url})` : "No upcoming song"
    });

    if (!this.isReady && this.lastControlMessage) {
      await this.lastControlMessage?.delete();
      this.lastControlMessage = undefined;
      this.lockUpdate = false;
      return;
    }

    try {
      if (!this.lastControlMessage || options?.force) {
        if (this.lastControlMessage) {
          await this.lastControlMessage?.delete();
          this.lastControlMessage = undefined;
        }
        const message: MessageCreateOptions = {
          content: options?.text,
          embeds: [embed],
          components: [...this.controlsRow()]
        };
        this.lastControlMessage = await this.channel?.send(message);
      } else {
        const message: MessageEditOptions = {
          embeds: [embed],
          components: [...this.controlsRow()]
        };
        await this.lastControlMessage.edit(message);
      }
    } catch (err) {
      console.log(`Music embed message was deleted, sending a new one.`);
      const sentMessage = await this.channel?.send({ embeds: [embed], components: [...this.controlsRow()] });
      this.lastControlMessage = sentMessage;
      const fixEmbed = embedFactory({ title: 'Hey, stop trying to break me...', description: 'Seriously, I ain\'t got time for this...', color: "White" });
      await this.channel?.send({ embeds: [fixEmbed] });
    }

    this.lockUpdate = false;
  }

  public async view(
    interaction: Message | CommandInteraction | ContextMenuCommandInteraction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client: Client
  ): Promise<void> {
    const currentTrack = this.currentTrack;
    if (!this.isReady || !currentTrack) {
      const pMsg = await interaction.reply({
        content: "> could not process queue atm, try later!",
        ephemeral: true,
      });
      if (pMsg instanceof Message) {
        setTimeout(() => pMsg?.delete(), 3000);
      }
      return;
    }

    if (!this.size) {
      const pMsg = await interaction.reply(
        `> Playing **${currentTrack.metadata.title}**`
      );
      if (pMsg instanceof Message) {
        setTimeout(() => pMsg?.delete(), 1e4);
      }
      return;
    }

    const current = `> Playing **${currentTrack.metadata.title}** out of ${
      this.size + 1
    }`;

    const pageOptions = new PaginationResolver((index, paginator) => {
      paginator.maxLength = this.size / 10;
      if (index > paginator.maxLength) {
        paginator.currentPage = 0;
      }

      const currentPage = paginator.currentPage;

      const queue = this.tracks
        .slice(currentPage * 10, currentPage * 10 + 10)
        .map(
          (track, sindex) =>
            `${currentPage * 10 + sindex + 1}. ${track.title}` +
            `${
              track.isYoutubeTrack() && track.info.duration
                ? ` (${track.info.duration})`
                : ""
            }`
        )
        .join("\n\n");

      return { content: `${current}\n\`\`\`markdown\n${queue}\`\`\`` };
    }, Math.round(this.size / 10));

    await new Pagination(interaction, pageOptions, {
      enableExit: true,
      onTimeout: (index, message) => {
        if (message.deletable) {
          message?.delete();
        }
      },
      type: Math.round(this.size / 10) <= 5 ? PaginationType.Button : PaginationType.SelectMenu,
      time: 6e4,
    }).send();
  }
}

export class MyPlayer extends Player {
  constructor() {
    super();

    this.on<MyQueue, "onStart">("onStart", ([queue]) => {
      queue.updateControlMessage({ force: true });
    });

    this.on<MyQueue, "onFinishPlayback">("onFinishPlayback", ([queue]) => {
      queue.leave();
    });

    this.on<MyQueue, "onPause">("onPause", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onResume">("onResume", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onError">("onError", ([queue, err]) => {
      queue.updateControlMessage({
        force: true,
        text: `Error: ${err.message}`,
      });
    });

    this.on<MyQueue, "onFinish">("onFinish", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onLoop">("onLoop", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onRepeat">("onRepeat", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onSkip">("onSkip", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onTrackAdd">("onTrackAdd", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onLoopEnabled">("onLoopEnabled", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onLoopDisabled">("onLoopDisabled", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onRepeatEnabled">("onRepeatEnabled", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onRepeatDisabled">("onRepeatDisabled", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onMix">("onMix", ([queue]) => {
      queue.updateControlMessage();
    });

    this.on<MyQueue, "onVolumeUpdate">("onVolumeUpdate", ([queue]) => {
      queue.updateControlMessage();
    });
  }

  getQueue(guild: Guild, channel?: TextBasedChannel): MyQueue {
    return super.queue<MyQueue>(guild, () => new MyQueue(this, guild, channel));
  }
}
