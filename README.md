# Thoybot-Refresh-Project

Choose your language | 選擇語言 | 选择语言:
- [English](README.md)
- [繁體中文](README.zh-TW.md)
- [简体中文](README.zh-CN.md)

**Thoybot-Refresh-Project (TRP)** is a powerful and flexible Discord bot that supports both **User Install Mode** and **Guild Install Mode**. With its modular command structure, event handling, and configuration settings, TRP provides an easy-to-use experience for bot users and administrators.

## Features
- **User Install Mode**: Allows individual users to install the bot.
- **Guild Install Mode**: Supports installation for specific Discord servers (guilds).
- **Command Management**: Modular commands for various actions.
- **Event Handling**: Automated actions based on specific events (e.g., disconnect, error handling).
- **Slash Commands**: Supports both global and guild-specific slash commands.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version >= 14.0.0)
- [npm](https://npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Step 1: Clone the repository

```bash
git clone https://github.com/LvzBxLzSyP/Thoybot-Refresh-Project.git
cd Thoybot-Refresh-Project
```

### Step 2: Install dependencies

```bash
npm install
# or if you're using Yarn
yarn install
```

### Step 3: Configure the bot

Rename config.example.json to config.json.

Add your bot token, prefix, and other configuration details in config.json.


### Step 4: Run the bot

```bash
node index.js
```

Usage

Once the bot is running, you can interact with it using slash commands (e.g., /ping, /info, /help). Custom commands can be added or modified by editing files in the commands/ folder.

Commands

/ping: Check if the bot is responsive.

/info: Get general bot information.

/help: Display a list of available commands.

/nethergames: Interact with NetherGames-related commands.

/addcron: Add cron tasks for periodic actions.


Contribution

Feel free to fork the project and submit pull requests for new features or bug fixes.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
