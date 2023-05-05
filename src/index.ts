import puppeteer from "puppeteer";
import * as openai from "openai";
import nodemailer from "nodemailer";
import {
  Client,
  Intents,
  Message,
  MessageActionRow,
  MessageButton,
  TextBasedChannels,
  GuildMember,
  User,
} from "discord.js";
import dotenv from "dotenv";

interface ScrapeResult {
  title: string;
  text: string;
}

dotenv.config();

emailBot(process.env.DISCORD_BOT_TOKEN);

async function scrapeWebPage(url: string): Promise<ScrapeResult> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // extract information from the page using Puppeteer methods
  const pageTitle = await page.title();
  const pageText = await page.evaluate(() => {
    const pageContent = document.querySelector("body")!.innerText;
    return pageContent;
  });

  await browser.close();

  return { title: pageTitle, text: pageText };
}

async function generateEmailContent(context: string): Promise<string> {
  // Set up the OpenAI API client
  const client = new openai.OpenAI(process.env.OPENAI_API_KEY!);

  // Define the parameters for the API request
  const prompt = `Write an email to send to the team:\n\n${context}\n\nEmail:`;
  const model = "text-davinci-002";
  const temperature = 0.5;
  const maxTokens = 1024;
  const completion = await client.complete({
    prompt: prompt,
    model: model,
    temperature: temperature,
    maxTokens: maxTokens,
    n: 1,
    stop: "\n",
  });

  // Extract the email content from the API response
  const emailContent = completion.choices[0].text.trim();

  // Return the generated email content
  return emailContent;
}

async function sendEmail(
  to: string[],
  subject: string,
  body: string
): Promise<void> {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT!),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ADDRESS!, // your email address
      pass: process.env.EMAIL_PASSWORD!, // your email password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_ADDRESS}>`, // sender address
    to: to.join(", "), // list of recipients
    subject: subject, // Subject line
    text: body, // plain text body
    html: `<b>${body}</b>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

async function getEmailRecipients(
  message: Message,
  additionalRecipients: string[]
): Promise<string[]> {
  const recipients: string[] = [];

  message.guild?.members.cache.forEach((member: GuildMember) => {
    if (!member.user.bot && member.user.email) {
      recipients.push(member.user.email);
    }
  });

  additionalRecipients.forEach((recipient: string) => {
    if (!recipients.includes(recipient)) {
      recipients.push(recipient);
    }
  });

  return recipients;
}

async function emailBot(token: string) {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_CONTENT,
    ],
  });

  // ...rest of the code...

  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;

    if (message.content.startsWith("!email")) {
      const args = message.content.split(" ");
      const url = args[1];
      const additionalRecipients = args.slice(2);

      const { title, text } = await scrapeWebPage(url);
      let emailContent = await generateEmailContent(`${title}\n${text}`);
      let recipients = await getEmailRecipients(message, additionalRecipients);
      let confirmationMessage = await sendConfirmationMessage(
        message.channel as TextBasedChannels,
        emailContent
      );

      const filter = (i: any) =>
        ["send", "cancel", "edit"].includes(i.customId) &&
        i.user.id === message.author.id;
      const collector = confirmationMessage.createMessageComponentCollector({
        filter,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "send") {
          const subject = "Generated Email"; // Replace with your desired subject
          await sendEmail(recipients, subject, emailContent);
          await interaction.update({ content: "Email sent!", components: [] });
          collector.stop();
        } else if (interaction.customId === "cancel") {
          await interaction.update({
            content: "Email canceled.",
            components: [],
          });
          collector.stop();
        } else if (interaction.customId === "edit") {
          await interaction.deferUpdate();
          const newContext = await interaction.channel.awaitMessages({
            max: 1,
            time: 30000,
            errors: ["time"],
            filter: (m: Message) => m.author.id === message.author.id,
          });
          emailContent = await generateEmailContent(
            `${title}\n${text}\n\n${newContext.first()?.content}`
          );
          confirmationMessage = await sendConfirmationMessage(
            message.channel as TextBasedChannels,
            emailContent
          );
        }
      });

      collector.on("end", async () => {
        if (!confirmationMessage.deleted) {
          await confirmationMessage.delete();
        }
      });
    }
  });

  client.login(token);
}

async function sendConfirmationMessage(
  channel: TextBasedChannels,
  emailContent: string
): Promise<any> {
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("send")
      .setLabel("Send Email")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle("DANGER"),
    new MessageButton()
      .setCustomId("edit")
      .setLabel("Edit")
      .setStyle("SECONDARY")
  );

  const confirmationMessage = await channel.send({
    content: `Are you sure you want to send this email?\n\n${emailContent}`,
    components: [row],
  });

  return confirmationMessage;
}
