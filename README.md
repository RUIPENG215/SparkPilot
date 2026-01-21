# SparkPilot - 电子学习与设计平台

SparkPilot 是一个集成了 **EDA 设计**、**AR 焊接辅助** 和 **AI 智能助手** 的现代化电子学习平台。旨在帮助初学者和爱好者打破硬件开发门槛，从零开始点亮创意。

## ✨ 核心亮点

### 1. 🔮 AR 焊接辅助系统 (v2.0 全新升级)
利用 WebAR 技术将电路图直接“贴”在真实 PCB 上，像玩游戏一样完成焊接。
*   **沉浸式 HUD 界面**：全新赛博朋克风格 UI，深色模式配合动态扫描线与暗角特效，提供专业级的平视显示体验。
*   **智能镜像投影 (Smart Mirroring)**：首创**正反面自动切换逻辑**。正面插件时显示原图；当步骤切换至背面焊接时，AR 接线图自动进行镜像翻转，完美解决洞洞板焊接时的左右视差难题。
*   **自适应空间布局**：系统自动计算接线图比例，将虚拟内容智能映射至 Marker 右侧（避开手部遮挡），并放大 5 倍显示，模拟真实洞洞板的贴合效果。
*   **稳态追踪技术**：内置平滑插值算法 (Smoothing Algorithm)，有效消除摄像头噪点导致的画面抖动与平面漂移，让虚拟连线“钉”在桌面上。

### 2. 🛠️ 无需安装的 EDA 工作台
*   深度集成立创 EDA 专业版，无需下载庞大软件，打开浏览器即可进行原理图绘制和 PCB 布局。
*   无缝切换设计与学习模式，所见即所得。

### 3. 🤖 AI 电路设计专家
*   基于 Coze 智能体架构（集成 GPT-4/Doubao 模型）。
*   **实时伴随**：在设计过程中随时解答电路原理、元器件选型建议。
*   **智能纠错**：辅助检查 ERC (电气规则) 错误，提供优化方案。

---

## 🛠️ 技术栈

*   **前端**：HTML5, Tailwind CSS (UI), Three.js (3D), AR.js (WebAR)
*   **后端**：Node.js, Express (用于 API 转发)
*   **AI 集成**：Coze API (v3 Chat)

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/sparkpilot.git
cd sparkpilot
```

### 2. 后端配置 (AI 服务)

本项目包含一个轻量级后端服务，用于安全地调用 AI 接口。

```bash
cd server
npm install
```

**配置环境变量：**

在 `server` 目录下创建一个 `.env` 文件，并填入您的 Coze API 密钥：

```env
COZE_API_KEY=your_coze_pat_token_here
COZE_BOT_ID=7582248770554576902
PORT=3000
```

> **注意**：`COZE_API_KEY` 请勿提交到版本控制系统中。

**启动服务：**

```bash
node index.js
```

服务默认运行在 `http://localhost:3000`。

### 3. 前端运行

推荐使用 VS Code 的 "Live Server" 插件或类似工具打开根目录下的 `index.html`。

确保浏览器可以直接访问 `http://localhost:3000` 以便前端能正常调用 AI 接口。

## 📂 目录结构

```
.
├── index.html                  # 主页 (落地页 + EDA 集成)
├── pcb-soldering-assistant.html # AR 焊接辅助主程序 (v2.0 核心)
├── webar-demo.html             # AR 功能演示
├── server/                     # 后端代理服务 (AI 接口)
│   ├── index.js
│   └── .env                    # (需手动创建) 密钥配置
└── images/                     # 静态资源 (含 wiring-diagram.png 示例)
```

## ⚠️ 使用须知

*   **AR 准备**：请使用手机或带摄像头的电脑访问。需打印或在另一台设备上显示 [Hiro Marker](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/hiro.png)。
*   **环境要求**：AR 识别对光线敏感，请确保环境光照充足且均匀。
*   **API 安全**：请勿将包含 API Key 的 `.env` 文件上传到 GitHub。

## 📄 License

MIT
