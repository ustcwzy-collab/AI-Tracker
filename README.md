# AI Usage Tracker · 额度明细增强版

Chrome 扩展，本仓库基于 [cupcakedev/ai-usage-extension](https://github.com/cupcakedev/ai-usage-extension) 的发布包做局部增强。当前版本为 **0.1.26.3**，仓库根目录包含可直接加载的扩展文件，不是完整的 TypeScript 源码构建工程。

本版改进：

- 修复 Kimi 额度接口解析，补充订阅总用量展示。
- 补充 Codex 套餐、积分、额度状态等明细，并新增独立的 ChatGPT 聊天卡片。
- 在设置中选择显示哪些服务、额度和明细。
- 保持紧凑弹窗，内容较多时在列表内部滚动。

## 安装

1. [下载 0.1.26.3 安装包](https://github.com/ustcwzy-collab/AI-Tracker/raw/refs/heads/main/AI-Usage-Tracker-0.1.26.3.zip)，解压到一个固定目录，安装后不要移动或删除这个文件夹。
2. 在 Chrome 打开 `chrome://extensions`，开启右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的目录。
4. 将扩展固定到工具栏，在相应服务登录后打开扩展查看用量。ChatGPT 聊天限额需要在已登录的 ChatGPT 页面打开一个新聊天后读取。

也可以下载或克隆本仓库，直接选择仓库根目录加载。若同时安装了商店版，建议暂时停用商店版，避免重复显示。

点击弹窗的设置按钮可调整展示内容。**首次使用 Kimi 时，需要在设置的服务列表中启用 Kimi / Code**，并在同一 Chrome 个人资料中登录 `www.kimi.com`，正常刷新页面并保持一个 Kimi 标签页打开，再刷新插件；偏好较小窗口可选择单列布局。

## 数据与更新说明

扩展只展示接口实际提供的数据。ChatGPT 部分模型接口不会提供剩余次数，这时会明确显示未提供，不能据此推算剩余消息数；功能剩余次数和重置时间也仅在接口有数据时展示。无数据的项目可能自动隐藏，接口变化、登录状态和账号方案都会影响可用信息。

这是通过开发者模式加载的本地版本，**不会随 Chrome 网上应用店自动更新**。更新时下载新版，替换原目录中的扩展文件，再到 `chrome://extensions` 点击该扩展的重新加载按钮。

## 来源与许可

原项目：[cupcakedev/ai-usage-extension](https://github.com/cupcakedev/ai-usage-extension)，Copyright (c) 2026 cupcakedev。

本仓库保留上游 [MIT License](LICENSE) 及版权声明。修改基于发布包中的已构建文件，作为独立增强版本提供；上游完整源码与构建流程请参阅原项目。
