import {
  ChannelType,
  GuildScheduledEventManager,
  GuildScheduledEventStatus,
  SlashCommandBuilder,
  VoiceChannelResolvable,
} from 'discord.js';
import { CommandRun } from '../types';

import { sample } from 'lodash-es';

// To be able to easily rename the options, we can use an enum
enum Options {
  Title = 'title',
  Emergency = 'emergency',
  Channel = 'channel',
}

const GifLinkList = [
  'https://tenor.com/view/among-us-kill-all-impostor-gif-18706928',
  'https://tenor.com/view/exchange-alert-exchange-among-us-among-us-alert-exchange-among-us-alert-gif-18859228',
  'https://tenor.com/view/among-us-digibyte-dgb-meme-button-gif-18569623',
  'https://tenor.com/view/amongus-amongsdp-black-emergency-meeting-black-emergency-meeting-gif-18720662',
  'https://tenor.com/view/among-us-emergency-meeting-oneforgetfulbug-cryless-the-legend-gif-18740742',
  'https://tenor.com/view/among-us-kill-all-impostor-gif-18706928',
  'https://tenor.com/view/emergency-meeting-among-us-meeting-discuss-gif-18383222',
  'https://tenor.com/view/among-us-emergency-meeting-yeet-shaking-triggered-gif-24737468',
];

const meetingDurationMins = 30;

const createEvent = async (
  eventManager: GuildScheduledEventManager,
  title: string,
  emergency: boolean,
  channel: VoiceChannelResolvable,
) => {
  let startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() + 1);

  let endTime = new Date();
  endTime.setMinutes(startTime.getMinutes() + meetingDurationMins);

  const event = await eventManager.create({
    name: emergency ? `EMERGENCY: ${title}` : title,
    description: 'Quick meeting via Meeting Manager.',
    scheduledStartTime: startTime,
    scheduledEndTime: endTime,
    privacyLevel: 2,
    entityType: 2,
    channel: channel,
  });

  return event;
};

export const command = new SlashCommandBuilder()
  .setName('meeting')
  .setDescription('Announce a meeting')
  .addStringOption(option => {
    return option
      .setName(Options.Title)
      .setDescription('Title and reason for the meeting.')
      .setRequired(true);
  })
  .addChannelOption(option => {
    return option
      .setName(Options.Channel)
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice)
      .setDescription('Voice channel that the meeting will take place in.');
  })
  .addBooleanOption(option => {
    return option
      .setName(Options.Emergency)
      .setDescription('If it is a emergency meeting or not.');
  });

export const run: CommandRun = async (client, interaction) => {
  // Cast the value to a string, as it is a string option
  const { value: title } = interaction.options.get(Options.Title, true) as {
    value: string;
  };

  const { value: channel } = interaction.options.get(Options.Channel, true) as {
    value: VoiceChannelResolvable;
  };

  const { value: emergency = false } = (interaction.options.get(
    Options.Emergency,
  ) || {}) as { value?: boolean };

  // Create the event
  if (interaction.guild != null) {
    const meetingEvent = await createEvent(
      interaction.guild.scheduledEvents,
      title,
      emergency,
      channel,
    );
    meetingEvent.setStatus(GuildScheduledEventStatus.Active);

    // Run command logic here
    let messageReply = emergency
      ? `# @everyone EMERGENCY MEETING: ${title}`
      : `# Quick meeting @everyone!\n ## ${title}`;

    messageReply += `\n<#${meetingEvent.channelId}>`;

    // Use editReply as we already have deferred the reply, and we want to update it
    const message = await interaction.editReply({
      content: messageReply,
      allowedMentions: { parse: ['everyone'] },
    });

    if (emergency) {
      let randGif = sample(GifLinkList) ?? '';
      await interaction.channel?.send(randGif);
    }

    const thread = await message.startThread({
      name: `Meeting notes for ${meetingEvent.name}`,
    });
  }
};
