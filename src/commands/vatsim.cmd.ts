import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import moment from "moment";
import { embedFactory, handleError } from "../common/utils.js";
import Vatsim from "../common/VATSIM.js";

@Discord()
@SlashGroup({name: 'vatsim', description: 'Some VATSIM commands'})
export abstract class VATSIM {
  @Slash({ description: "Online activity brief from VATSIM" })
  @SlashGroup('vatsim')
  async online(interaction: CommandInteraction) {
    await interaction.deferReply();

    let data: any;

    try {
      data = await Vatsim.online();
    } catch (e) {
      handleError(e, interaction);
      return;
    }

    if (!data) {
      handleError(`Could not retrieve VATSIM online data!`, interaction);
      return;
    }

    const embed = embedFactory({
      title: `VATSIM Online Activity`,
      interaction: interaction,
    })
    .addFields(
      { name: `Pilots`, value: `${data.pilots.length}`, inline: true },
      { name: `ATC`, value: `${data.controllers.length}`, inline: true },
      { name: `Last Updated`, value: `<t:${moment(data.general?.update_timestamp).unix()}:R>` }
    );
    interaction.followUp({ embeds: [embed] });
  }
}