# Project Setup discord-bot-chat-gpt-email-composing

This README will guide you through the steps to set up, install the necessary dependencies, and deploy the Discord email bot that uses GPT-3 API for content generation and web scraping for providing context.
## Prerequisites
- Node.js (version >= 14.x.x)
- NPM (version >= 7.x.x)
- Git
## Setup 
1. Clone the repository:

```bash

git clone https://github.com/your-repo-url/discord-email-bot.git
``` 
2. Go to the project directory:

```bash

cd discord-email-bot
``` 
3. Install the required dependencies:

```

npm install
``` 
4. Create a `.env` file in the project root folder and add the following environment variables:

```makefile

DISCORD_BOT_TOKEN=<your-discord-bot-token>
OPENAI_API_KEY=<your-openai-api-key>
EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_ADDRESS=<your-email-address>
EMAIL_PASSWORD=<your-email-password>
EMAIL_NAME=<your-email-display-name>
```



Replace `<your-discord-bot-token>` with your Discord bot token, `<your-openai-api-key>` with your OpenAI API key, and `<your-email-*>` variables with your email service credentials.
## Running the project 
1. Compile the TypeScript code:

```arduino

npm run build
``` 
2. Run the compiled JavaScript code:

```sql

npm start
```

Your Discord bot should now be up and running.
## Deploying to a free online server

To deploy the Discord bot on a free online server, we will be using [Heroku](https://www.heroku.com/) . 
1. Sign up for a free account on [Heroku](https://www.heroku.com/) . 
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)  on your local machine. 
3. Log in to your Heroku account using the CLI:

```

heroku login
``` 
4. Create a new Heroku app:

```lua

heroku create <your-app-name>
```



Replace `<your-app-name>` with the desired name for your Heroku app. 
5. Set the required environment variables on Heroku:

```arduino

heroku config:set DISCORD_BOT_TOKEN=<your-discord-bot-token>
heroku config:set OPENAI_API_KEY=<your-openai-api-key>
heroku config:set EMAIL_HOST=<your-email-host>
heroku config:set EMAIL_PORT=<your-email-port>
heroku config:set EMAIL_ADDRESS=<your-email-address>
heroku config:set EMAIL_PASSWORD=<your-email-password>
heroku config:set EMAIL_NAME=<your-email-display-name>
``` 
6. Modify `package.json` by adding the `engines` field and the `heroku-postbuild` script:

```json

{
  ...
  "engines": {
    "node": "14.x"
  },
  "scripts": {
    ...
    "heroku-postbuild": "npm run build"
  },
  ...
}
``` 
7. Add a `Procfile` in the project root folder with the following content:

```bash

worker: node dist/index.js
``` 
8. Commit the changes:

```sql

git add .
git commit -m "Prepare for Heroku deployment"
``` 
9. Push the changes to Heroku:

```css

git push heroku main
``` 
10. Scale the worker dyno:

```

heroku ps:scale worker=1
```

Your Discord bot should now be running on Heroku.