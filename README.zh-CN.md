# Thoybot-Refresh-Project

**Thoybot-Refresh-Project (TRP)** 是一个功能强大且灵活的 Discord 机器人，支持 **用户安装模式** 和 **服务器安装模式**。TRP 提供模块化的指令结构、事件处理及自定义配置，为用户和管理员带来简单易用的体验。

## 功能
- **用户安装模式**：允许个人用户安装机器人。
- **服务器安装模式**：支持特定 Discord 服务器的安装。
- **指令管理**：模块化设计，方便新增或修改指令。
- **事件处理**：自动执行特定事件（例如断线或错误处理）。
- **斜线指令**：支持全局及服务器特定的斜线指令。

## 安装

### 需求
- [Node.js](https://nodejs.org/) (版本 >= 14.0.0)
- [npm](https://npmjs.com/) 或 [Yarn](https://yarnpkg.com/)

### 第一步：克隆项目

```bash
git clone https://github.com/LvzBxLzSyP/Thoybot-Refresh-Project.git
cd Thoybot-Refresh-Project
```

第二步：安装依赖

```bash
npm install
# 或者使用 Yarn
yarn install
```

第三步：配置机器人

将 config.example.json 重命名为 config.json。

在 config.json 中填写机器人的 Token、前缀和其他配置。


第四步：启动机器人

```bash
node index.js
```

使用方法

启动机器人后，可通过斜线指令进行互动（例如 /ping、/info、/help）。若需新增或修改指令，可编辑 commands/ 文件夹中的文件。

指令列表

/ping：测试机器人是否响应。

/info：获取机器人的基本信息。

/help：显示可用指令列表。

/nethergames：与 NetherGames 相关的指令。

/addcron：新增周期性任务。


贡献

欢迎 Fork 本项目并提交 Pull Request，新增功能或修复问题。

授权

本项目基于 ISC 授权条款，详见 [LICENSE](LICENSE) 文件。