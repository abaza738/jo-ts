import { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from "discord.js";
import ytsr, { Video } from "ytsr";

export class YouTube {
  static async getSearchAutocompleteOptions(interaction: AutocompleteInteraction<import("discord.js").CacheType>): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);

    if (!focusedOption.value) {
      interaction.respond([]);
      return;
    }
    
    const filteredList: ApplicationCommandOptionChoiceData[] = [];

    const filters = await ytsr.getFilters(focusedOption.value);
    const search = filters.get('Type')?.get('Video');

    if (!search?.url) {
      interaction.respond([]);
      return;
    }

    const result = await ytsr(search.url, { limit: 20 });

    if (result.items.length < 1) {
      interaction.respond([]);
      return;
    }

    const listOfVideos = result.items.filter(item => item.type === 'video') as Video[];
    
    for (const song of listOfVideos) {
      filteredList.push({ name: song.title, value: song.url });
    }
    
    return interaction.respond(filteredList);
  }
}