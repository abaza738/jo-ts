import type { ArgsOf, Client } from "discordx";
import {
  ButtonComponent,
  Discord,
  On,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import type { CommandInteraction, Guild } from "discord.js";
import { GuildMember, EmbedBuilder } from "discord.js";
import type { MyQueue } from "../common/music.js";
import { MyPlayer } from "../common/music.js";

@Discord()
@SlashGroup({ name: "music" })
export class music {
  player;

  constructor() {
    this.player = new MyPlayer();
  }

  @On("voiceStateUpdate")
  voiceUpdate(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: Client
  ): void {
    const queue = this.player.getQueue(oldState.guild);

    if (
      !queue.isReady ||
      !queue.voiceChannelId ||
      (oldState.channelId != queue.voiceChannelId &&
        newState.channelId != queue.voiceChannelId) ||
      !queue.channel
    ) {
      return;
    }

    const channel =
      oldState.channelId === queue.voiceChannelId
        ? oldState.channel
        : newState.channel;

    if (!channel) {
      return;
    }

    const totalMembers = channel.members.filter((m) => !m.user.bot);

    if (queue.isPlaying && !totalMembers.size) {
      queue.pause();
      queue.channel.send(
        "> To save resources, I have paused the queue since everyone has left my voice channel."
      );

      if (queue.timeoutTimer) {
        clearTimeout(queue.timeoutTimer);
      }

      queue.timeoutTimer = setTimeout(() => {
        queue.channel?.send(
          "> My voice channel has been open for 5 minutes and no one has joined, so the queue has been deleted."
        );
        queue.leave();
      }, 5 * 60 * 1000);
    } else if (queue.isPause && totalMembers.size) {
      if (queue.timeoutTimer) {
        clearTimeout(queue.timeoutTimer);
        queue.timeoutTimer = undefined;
      }
      queue.resume();
      queue.channel.send(
        "> There has been a new participant in my voice channel, and the queue will be resumed. Enjoy the music 🎶"
      );
    }
  }

  validateControlInteraction(
    interaction: CommandInteraction,
    client: Client
  ): MyQueue | undefined {
    if (
      !interaction.guild ||
      !interaction.channel ||
      !(interaction.member instanceof GuildMember)
    ) {
      interaction.reply(
        "> Your request could not be processed, please try again later"
      );
      return;
    }

    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (interaction.member.voice.channelId !== queue.voiceChannelId) {
      interaction.reply(
        "> To use the controls, you need to join the bot voice channel"
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    return queue;
  }

  @ButtonComponent("btn-next")
  async nextControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.skip();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent("btn-pause")
  async pauseControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.isPause ? queue.resume() : queue.pause();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent("btn-leave")
  async leaveControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.leave();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent("btn-repeat")
  async repeatControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.setRepeat(!queue.repeat);
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent("btn-queue")
  queueControl(interaction: CommandInteraction, client: Client): void {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.view(interaction, client);
  }

  @ButtonComponent("btn-mix")
  async mixControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.mix();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent("btn-controls")
  async controlsControl(
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = this.validateControlInteraction(interaction, client);
    if (!queue) {
      return;
    }
    queue.updateControlMessage({ force: true });
    await interaction.deferReply();
    interaction.deleteReply();
  }

  async processJoin(
    interaction: CommandInteraction,
    client: Client
  ): Promise<MyQueue | undefined> {
    if (
      !interaction.guild ||
      !interaction.channel ||
      !(interaction.member instanceof GuildMember)
    ) {
      interaction.reply(
        "> Your request could not be processed, please try again later"
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    if (
      !(interaction.member instanceof GuildMember) ||
      !interaction.member.voice.channel
    ) {
      interaction.reply("> You are not in the voice channel");

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    await interaction.deferReply();
    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (!queue.isReady) {
      queue.channel = interaction.channel;
      await queue.join(interaction.member.voice.channel);
    }

    return queue;
  }

  @Slash("play", { description: "Play a song" })
  @SlashGroup("music")
  async play(
    @SlashOption("song", { description: "song name" })
    songName: string,
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = await this.processJoin(interaction, client);
    if (!queue) {
      return;
    }
    const song = await queue.play(songName, { user: interaction.user });
    if (!song) {
      interaction.followUp("The song could not be found");
    } else {
      const embed = new EmbedBuilder();
      embed.setTitle("Enqueued");
      embed.setDescription(`Enqueued song **${song.title}****`);
      interaction.followUp({ embeds: [embed] });
    }
  }

  @Slash("playlist", { description: "Play a playlist" })
  @SlashGroup("music")
  async playlist(
    @SlashOption("playlist", { description: "playlist name" })
    playlistName: string,
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const queue = await this.processJoin(interaction, client);
    if (!queue) {
      return;
    }
    const songs = await queue.playlist(playlistName, {
      user: interaction.user,
    });
    if (!songs) {
      interaction.followUp("The playlist could not be found");
    } else {
      const embed = new EmbedBuilder();
      embed.setTitle("Enqueued");
      embed.setDescription(`Enqueued  **${songs.length}** songs from playlist`);
      interaction.followUp({ embeds: [embed] });
    }
  }

  // @Slash("spotify", { description: "Play a spotify link" })
  // @SlashGroup("music")
  // async spotify(
  //   @SlashOption("link", { description: "spotify link" })
  //   link: string,
  //   interaction: CommandInteraction,
  //   client: Client
  // ): Promise<void> {
  //   const queue = await this.processJoin(interaction, client);
  //   if (!queue) {
  //     return;
  //   }
  //   const songs = await queue.spotify(link, { user: interaction.user });
  //   if (!songs) {
  //     interaction.followUp("The spotify song/playlist could not be found");
  //   } else {
  //     const embed = new EmbedBuilder();
  //     embed.setTitle("Enqueued");
  //     embed.setDescription(`Enqueued  **${songs.length}** spotify songs`);
  //     interaction.followUp({ embeds: [embed] });
  //   }
  // }

  validateInteraction(
    interaction: CommandInteraction,
    client: Client
  ): undefined | { guild: Guild; member: GuildMember; queue: MyQueue } {
    if (
      !interaction.guild ||
      !(interaction.member instanceof GuildMember) ||
      !interaction.channel
    ) {
      interaction.reply(
        "> Your request could not be processed, please try again later"
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    if (!interaction.member.voice.channel) {
      interaction.reply(
        "> To use the music commands, you need to join voice channel"
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (
      !queue.isReady ||
      interaction.member.voice.channel.id !== queue.voiceChannelId
    ) {
      interaction.reply(
        "> To use the music commands, you need to join the bot voice channel"
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    return { guild: interaction.guild, member: interaction.member, queue };
  }

  @Slash("skip", { description: "skip track" })
  @SlashGroup("music")
  skip(interaction: CommandInteraction, client: Client): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    queue.skip();
    interaction.reply("> skipped current song");
  }

  @Slash("mix", { description: "mix tracks" })
  @SlashGroup("music")
  mix(interaction: CommandInteraction, client: Client): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    queue.mix();
    interaction.reply("> mixed current queue");
  }

  @Slash("pause", { description: "pause music" })
  @SlashGroup("music")
  pause(interaction: CommandInteraction, client: Client): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    if (queue.isPause) {
      interaction.reply("> already paused");
      return;
    }

    queue.pause();
    interaction.reply("> paused music");
  }

  @Slash("resume", { description: "resume music" })
  @SlashGroup("music")
  resume(interaction: CommandInteraction, client: Client): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    if (queue.isPlaying) {
      interaction.reply("> already playing");
      return;
    }

    queue.resume();
    interaction.reply("> resumed music");
  }

  @Slash("seek", { description: "seek music" })
  @SlashGroup("music")
  seek(
    @SlashOption("time", {
      description: "seek time in seconds",
    })
    time: number,
    interaction: CommandInteraction,
    client: Client
  ): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    if (!queue.isPlaying || !queue.currentTrack) {
      interaction.reply("> currently not playing any song");
      return;
    }

    const state = queue.seek(time * 1000);
    if (!state) {
      interaction.reply("> could not seek");
      return;
    }
    interaction.reply("> current music seeked");
  }

  @Slash("leave", { description: "stop music" })
  @SlashGroup("music")
  leave(interaction: CommandInteraction, client: Client): void {
    const validate = this.validateInteraction(interaction, client);
    if (!validate) {
      return;
    }

    const { queue } = validate;
    queue.leave();
    interaction.reply("> stopped music");
  }
}
