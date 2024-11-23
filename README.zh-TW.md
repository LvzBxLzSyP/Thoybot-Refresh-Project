# Thoybot-Refresh-Project

**Thoybot-Refresh-Project (TRP)** 是一款功能強大且靈活的 Discord 機器人，支援 **用戶安裝模式** 和 **伺服器安裝模式**。TRP 提供模組化的指令結構、事件處理及自定義配置，為用戶和管理員帶來簡單易用的體驗。

## 功能
- **用戶安裝模式**：允許個別用戶安裝機器人。
- **伺服器安裝模式**：支援特定 Discord 伺服器的安裝。
- **指令管理**：模組化設計，方便新增或修改指令。
- **事件處理**：自動執行特定事件（例如斷線或錯誤處理）。
- **斜線指令**：支援全域及伺服器特定的斜線指令。

## 安裝

### 需求
- [Node.js](https://nodejs.org/) (版本 >= 14.0.0)
- [npm](https://npmjs.com/) 或 [Yarn](https://yarnpkg.com/)

### 第一步：克隆此專案
```bash
git clone https://github.com/yourusername/Thoybot-Refresh-Project.git
cd Thoybot-Refresh-Project
```

第二步：安裝依賴

```bash
npm install
# 或者使用 Yarn
yarn install
```

第三步：配置機器人

將 config.example.json 重命名為 config.json。

在 config.json 中填寫機器人的 Token、前綴和其他配置。


第四步：啟動機器人

```bash
node index.js
```

使用方法

啟動機器人後，可透過斜線指令進行互動（例如 /ping、/info、/help）。欲新增或修改指令，可編輯 commands/ 資料夾中的檔案。

指令列表

/ping：測試機器人是否回應。

/info：獲取機器人的基本資訊。

/help：顯示可用指令列表。

/nethergames：與 NetherGames 相關的指令。

/addcron：新增週期性任務。


貢獻

歡迎 Fork 本專案並提交 Pull Request，新增功能或修復問題。

授權

本專案基於 ISC 授權條款，詳見 [LICENSE](LICENSE) 文件。