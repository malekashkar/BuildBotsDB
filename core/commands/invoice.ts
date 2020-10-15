import { Message } from "discord.js";
import Command from ".";
import Main from "../..";
import { DbGuild } from "../models/guild";
import { DbUser } from "../models/user";
import embeds from "../utils/embeds";

export default class InvoiceCommand extends Command {
  cmdName = "invoice";
  description = "Create or delete invoices.";
  groupName = "payments";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const options = Object.keys(this).filter(
      (x) => typeof (this as any)[x] === "function"
    );
    type Option = typeof options[number];
    const option = args[0] as Option;
    if (!option)
      return message.channel.send(
        embeds.error(
          `Please provide one of the following arguments: \`${options.join(
            ", "
          )}\``
        )
      );

    try {
      (this as any)[option](
        client,
        message,
        args,
        userData,
        guildData,
        command
      );
    } catch (e) {
      message.channel.send(
        embeds.error(
          `\`${option}\` is not a \`${this.cmdName}\` command option.`
        )
      );
    }
  }

  create = async (
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) => {
    const gateways = ["paypal", "bitcoin", "g2a"] as const;
    const lowercaseArg = args[0].toLowerCase();
    const gateway = gateways.find((x) => lowercaseArg.includes(x));

    if (!gateway)
      return message.channel.send(
        embeds.error(
          `Please provide one of the following gateways: paypal, bitcoin, g2a`
        )
      );

    const info = args[2];
    if (!info)
      return message.channel.send(
        embeds.error(`Please provide the payment info for ${gateway}!`)
      );

    guildData.payments[gateway] = info;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `${
          gateway.charAt(0).toUpperCase() + gateway.slice(1).toLowerCase()
        } Gateway Set`,
        `The **${gateway}** gateway has been set to \`${info}\`.`
      )
    );
  };
}
