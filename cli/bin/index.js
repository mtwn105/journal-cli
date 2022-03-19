#! /usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import { Client } from "@notionhq/client";
import netrc from "node-netrc";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

let questions = [
  {
    id: 0,
    question: "One thing you have learned today",
    default: "",
    answer: "",
  },
  {
    id: 1,
    question:
      "One thing you could have done to make today better and how can you apply it tomorrow?",
    default: "",
    answer: "",
  },
  {
    id: 2,
    question: "You will remember today for",
    default: "",
    answer: "",
  },
  {
    id: 3,
    question: "Plans for tomorrow",
    default: "",
    answer: "",
  },
  {
    id: 4,
    question: "Request for your subconscious mind to sleep on",
    default: "",
    answer: "",
  },
];

const yarg = yargs(hideBin(process.argv));

const usage = `Usage: journal <command>`;

yarg
  .usage(usage)
  .demandCommand()
  .help(true)
  .command("connect", "Connect to notion.", async () => {
    console.log(gradient.pastel.multiline(figlet.textSync("Journal")));

    try {
      const token = netrc("journal-cli");

      if (token && token.token) {
        const isValid = await validateConnection(token.token);

        if (isValid) {
          console.log(chalk.green("You are already connected to notion."));
          console.log(
            chalk.blue("Use journal disconnect to disconnect from notion")
          );
          process.exit(0);
        } else {
          connectToNotion();
        }
      } else {
        connectToNotion();
      }
    } catch (err) {
      connectToNotion();
    }
  })
  .command("disconnect", "Disconnect from notion.", async () => {
    console.log(gradient.pastel.multiline(figlet.textSync("Journal")));

    try {
      const token = netrc("journal-cli");

      if (token && token.token) {
        // Delete token file
        netrc.update("journal-cli", {
          token: "",
        });

        console.log(chalk.green("You are disconnected from notion."));
      } else {
        console.log(chalk.red("You are not connected to notion."));
        process.exit(0);
      }
    } catch (err) {
      console.log(chalk.red("You are not connected to notion."));
      process.exit(0);
    }
  })
  .command("write", "Write journal.", async () => {
    console.log(gradient.pastel.multiline(figlet.textSync("Journal")));

    try {
      const token = netrc("journal-cli");

      if (token && token.token) {
        console.log(
          chalk.green(
            `\nAnswer the following questions to write in the journal:\n`
          )
        );

        for (let question of questions) {
          const answer = await inquirer.prompt({
            name: question.id.toString(),
            type: "input",
            message: question.question,
            default() {
              return question.default;
            },
          });

          question.answer = answer[question.id.toString()];
        }

        // console.log("Questions ", questions);

        // Save to notion

        const spinner = createSpinner("Saving to notion...").start();

        await saveToNotion(token.token);

        spinner.success({ text: `Successfully Saved to notion!` });

        console.log(
          chalk.green(
            `\nKeep Journaling.! If you like it then share it with your friends.`
          )
        );
      } else {
        console.log(
          chalk.red("\nPlease connect to notion first by using"),
          chalk.yellow("journal connect\n")
        );
        process.exit(1);
      }
    } catch (err) {
      console.log(
        chalk.red("\nPlease connect to notion first by using"),
        chalk.yellow("journal connect\n")
      );
      process.exit(1);
    }
  })
  .command("*", false, async () => {
    await welcome();
  }).argv;

async function welcome() {
  figlet(`Journal`, (err, data) => {
    console.log(gradient.pastel.multiline(data) + "\n");

    console.log(
      chalk.green(`Start writing your journal for today & sync it to notion.`)
    );

    console.log(
      chalk.blue(`\nStart by connecting with notion using`),
      chalk.yellow(`journal connect`),
      chalk.blue(`\nWrite by using`),
      chalk.yellow(`journal write`)
    );

    process.exit(0);
  });
}

async function saveToNotion(token) {
  const notion = new Client({
    auth: token,
  });

  const result = await notion.search({
    query: "Journal",
    filter: {
      property: "object",
      value: "database",
    },
  });

  const database = result.results[0];

  // Date as string in format DD MMM YYYY
  const today = new Date();
  const date = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let childrens = [];

  for (let question of questions) {
    let questionBlock = {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: question.question,
            },
          },
        ],
      },
    };

    let answerBlock = {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: question.answer,
            },
          },
        ],
      },
    };

    childrens.push(questionBlock);
    childrens.push(answerBlock);
  }

  const page = await notion.pages.create({
    parent: {
      database_id: database.id,
    },
    icon: {
      type: "emoji",
      emoji: "📅",
    },
    properties: {
      Date: {
        title: [
          {
            text: {
              content: date,
            },
          },
        ],
      },
    },
    children: childrens,
  });

  // console.log(page);
}

async function connectToNotion() {
  console.log(
    chalk.green(
      "\nStep 1 - Copy this page template to your notion: https://amit-wani.notion.site/amit-wani/Journal-a19377f6b17d47768e03d4ffe62a030d"
    )
  );

  console.log(
    chalk.green(
      "\nStep 2 - Open this link and give access to Journal CLI for this page: https://api.notion.com/v1/oauth/authorize?owner=user&client_id=14c758e3-a8d2-48c3-9d8e-778c93c4dbe3&redirect_uri=https://journal-notion-handler.fly.dev/auth/notion/callback&response_type=code"
    )
  );

  const token = await inquirer.prompt({
    name: "token",
    type: "password",
    message: "Paste the token copied after giving access here:",
    askAnswered: true,
    mask: true,
  });

  const spinner = createSpinner("Connecting to notion...").start();

  if (token.token) {
    // Try connecting to notion
    try {
      const valid = await validateConnection(token.token);

      if (valid) {
        // write a new token
        netrc.update("journal-cli", {
          token: token.token,
        });

        spinner.success({ text: `Successfully Connected to notion!` });
      } else {
        spinner.stop();
        console.log(
          chalk.red(
            "\nYou haven't selected correct database for journal. Try connecting again with `Journal` page copied earlier."
          )
        );
        process.exit(1);
      }
    } catch (err) {
      spinner.stop();
      console.log(chalk.red("\nError while connecting to notion"));
      process.exit(1);
    }
  } else {
    spinner.stop();
    console.log(chalk.red("\nInvalid token"));
    process.exit(1);
  }
}

async function validateConnection(token) {
  const notion = new Client({
    auth: token,
  });

  const result = await notion.search({
    query: "Journal",
    filter: {
      property: "object",
      value: "database",
    },
  });

  return !!result.results && result.results.length > 0 && !!result.results[0];
}
