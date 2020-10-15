import mongoose, { Document } from "mongoose";

export interface DbGuild extends Document {
  _id: string;
  prefix: string;
  roles?: {
    mute: string;
  };
  ticketTypes?: ticketTypes[];
  invites?: invites;
  payments?: IPayments;
  giveaways?: giveaways;
  createOrder?: {
    messageId: string;
  };
}

interface ticketTypes {
  name: string;
  panelChannelId: string;
  panelMessageId: string;
  categoryId?: string;
  joinMsg?: string;
  claimChannelId?: string;
}

interface invites {
  join: {
    channel: string;
    message: string;
  };
  leave: {
    channel: string;
    message: string;
  };
  roles: inviteRoles[];
}

interface inviteRoles {
  role: string;
  invites: number;
}

interface IPayments {
  paypal: string;
  bitcoin: string;
  g2a: string;
}

interface giveaways {
  bypassRoles: string[];
  giveawayList: giveawayList[];
}

interface giveawayList {
  prize: string;
  startTime: number;
  endTime: number;
  winners: number;
  messageId: string;
  channelId: string;
  condition: {
    requiredRoles: string[];
    requiredInvites: number;
    requiredGuilds: string[];
    requiredMessages: number;
  };
}

export const GuildSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  prefix: { type: String, required: true, default: "!" },
  roles: {
    mute: { type: String, default: "Muted" },
  },
  ticketTypes: [
    {
      name: { type: String, required: true },
      panelChannelId: { type: String, required: true },
      panelMessageId: { type: String, required: true },
      categoryId: String,
      joinMsg: {
        type: String,
        default: `Thank you for opening a ticket, support will be right with you.\nPlease wait patiently as they may be busy with others right now!`,
      },
      claimChannelId: String,
    },
  ],
  invites: {
    join: {
      type: {
        channel: String,
        message: {
          type: String,
          default: `Welcome (user) to the server. (inviter) now has (invites) invites.`,
        },
      },
      default: null,
    },
    leave: {
      type: {
        channel: String,
        message: String,
      },
      default: null,
    },
    roles: {
      type: [
        {
          role: { type: String, required: true, unique: true },
          invites: { type: Number, required: true },
        },
      ],
      default: null,
    },
  },
  payments: {
    paypal: String,
    bitcoin: String,
    g2a: String,
  },
  giveaways: {
    bypassRoles: [String],
    giveawayList: [
      {
        prize: String,
        startTime: Number,
        endTime: Number,
        winners: Number,
        messageId: String,
        channelId: String,
        condition: {
          requiredRoles: [String],
          requiredInvites: Number,
          requiredGuilds: [String],
          requiredMessages: Number,
        },
      },
    ],
  },
  createOrder: {
    messageId: String,
  },
});

export const GuildModel = mongoose.model<DbGuild>(`Guild`, GuildSchema);
