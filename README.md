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
git clone https://github.com/yourusername/Thoybot-Refresh-Project.git
cd Thoybot-Refresh-Project
```
Step 2: Install dependencies
```bash
npm install
# or if you're using Yarn
yarn install
```
Step 3: Configure the bot

Rename config.example.json to config.json.

Add your bot token, prefix, and other configuration details in config.json.


Step 4: Run the bot
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

### Key sections:
1. **Project Overview**: Brief description of what the bot is and its features.
2. **Installation**: Clear instructions on how to set up the bot, including dependencies and configuration steps.
3. **Usage**: Explains how to interact with the bot once it's running.
4. **Commands**: Provides a list of commands available in the bot.
5. **Contribution**: Encourages others to contribute to the project if they want.
6. **License**: Specifies the license for the project.

Feel free to modify or expand this according to your project's needs!