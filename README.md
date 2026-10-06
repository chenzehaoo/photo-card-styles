# Photo Card Styles

可复用的照片卡片 skill，附带 Vue 3 + TypeScript 实现。支持替换照片、修改文案、选择样式，以及导出带特效的成品照片。

此目录可以独立作为 GitHub 仓库根目录。它不是整个 Serene 应用，也不是无需接入即可运行的网站。

## 功能

| 类别 | 内容 |
| --- | --- |
| 平面卡片 | 125 个预设：5 个经典款，加上 24 种结构各 5 种配色 |
| 立体相框 | 6 种实体相框材质、景深浮雕、旋转与缩放 |
| 特效卡牌 | 21 种镭射、动漫、游戏与创意特效，支持叠合和分层查看 |
| 图片编辑 | 本地图片或 URL、文案、图片位置与替代文本 |
| 平面导出 | PNG、JPG、五张照片 ZIP，最高 2000 × 2500 |
| 特效导出 | 保留完整边框、特效和文案，使用对齐照片底层填满圆角外的四角 |

21 种特效：水墨剑气、极光星轨、熔岩裂隙、冰晶碎镜、霓虹音浪、漫画冲击、衍射光栅、折纸晶面、数据雨幕、樱华飞舞、时空回廊、符文回路、热血觉醒、赛博电击、魔法召唤、全息镭射、秘金圣器、赛博机甲、冰晶契约、霓虹叠影、晶透棱镜。

## 作为 Skill 使用

将此仓库内容放进本机的 `~/.codex/skills/photo-card-styles/`，确认该目录下直接包含 `SKILL.md`，不要多嵌套一层同名目录。自定义了 `CODEX_HOME` 时，使用其下的 `skills/photo-card-styles/`。随后在新的对话中使用：

```text
使用 $photo-card-styles，为我的照片添加卡片样式。
使用我提供的图片和文案，保留现有卡片尺寸，并加入成品 PNG 导出。
```

Skill 用于指导编码助手将组件接入项目，不会自动上传用户照片，也不需要 Serene 后端或 API Key。

## 接入 Vue 项目

仅使用平面卡片时，复制 `assets/PhotoCard.vue`、`assets/catalog.ts`、`assets/styles.css` 和整个 `assets/fonts/`。

```vue
<script setup lang="ts">
import PhotoCard from './photo-card-styles/PhotoCard.vue';
</script>

<template>
  <PhotoCard :card="{
    id: 'summer',
    image: '/photos/summer.jpg',
    type: 'postcard-jade',
    label: 'Summer memories',
    position: 'center'
  }" />
</template>
```

将自己的照片放到接收项目的 `public/photos/summer.jpg`，或改用你自己的图片地址。可编辑的最小组件见 [examples/BasicPhoto.vue](examples/BasicPhoto.vue)。该示例需要已有的 Vue 3 构建环境，不是独立应用。

完整工作室需要复制整个 `assets/`，并在接收项目中安装依赖：

```sh
npm install vue@^3.4.21 three@0.184.0 html-to-image@1.11.13 fflate@0.8.3
npm install --save-dev @types/three@0.184.1
```

这些是项目当前使用的版本，不表示最新版本。若已有 Vue，请优先保持接收项目的兼容版本，不要盲目覆盖依赖。

将 `PhotoStyleStudio.vue` 挂到你的路由，加载 Material Symbols 图标字体或替换成项目已有图标库。需要适配的部分包括：Serene 品牌文案、返回首页链接、应用按钮和存储键。具体文件、数据格式、CORS 和导出限制见 [接入文档](references/integration.md)。

## 边界与限制

- 默认卡片尺寸保持为桌面 200 × 250、平板 170 × 215、手机 150 × 190 CSS 像素。
- 示例编辑器面向五张照片；JSON 配置和“应用到首页”仅保存到当前浏览器，不是云端同步。
- 3D 设置目前不包含在五张照片的 JSON 配置内。
- 3D 效果叠加在原照片上，不是 AI 动漫转换、人物抠图或真实场景重建。
- PNG 是静态成品，不保存动画；不提供 GIF、视频或 GLB/OBJ 导出。
- 远程照片导出需要图片服务器允许 CORS；遇到限制可使用本地图片。
- 运行目标是浏览器/H5。小程序、原生客户端和其他前端框架需要适配，不保证直接可用。
- 源照片清晰度仍然限制导出细节；选择高分辨率不等于恢复原图细节。

## 发布检查

在本目录运行（需要 Node.js 18 或以上）：

```sh
node scripts/verify-package.mjs
```

该命令检查必需文件、相对导入、字体与许可文件，以及常见的凭证或本机路径残留。它不替代完整安全审计，也不验证浏览器渲染。发布前还应在接收项目运行类型检查、构建、桌面/手机交互和实际图片导出验证。

本目录不包含个人照片、浏览器配置 JSON 或 Serene 的后端文件。不要把这些内容作为示例提交。`.gitignore` 也不负责排除已经被 Git 跟踪的文件，推送前应审查暂存区。

## 许可与素材

原创代码和文档采用 [MIT License](LICENSE)，允许使用、修改、分发及商业使用，须保留版权与许可声明。

字体及第三方依赖采用各自的许可；示例图片 URL 不代表授予图片版权。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

维护者：`chenzehaoo`。本文件不表示 GitHub 仓库已经创建或发布。
