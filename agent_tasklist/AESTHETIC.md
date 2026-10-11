# FIDV 美学真源（美工部）

美工部判断网页与启动表层美学时，只以本文为准。产品是否服务金融决策，以 `DESIGN.md` 为准（总监）。概念与坐标以 `ai-chain/CONCEPTS.md` 为准。

目标：把已落地的美学语言写成可复用真源，并在后续功能与分页中**延展同一语言**，不每页另起一套皮。

**简洁是视觉第一要务**（与 DESIGN 一致）：能用色、透明、一字标说清的，不加第二套装饰系统。业主明示的时长（如 splash hold / fade）写入本文后，美工部不得以「简洁」擅自缩短。

---

## 1. 已运用的美学语言

### 色板

> **2026-10-07 业主明示：交互页面由深色底改为白色底。** 下表为新真源。US / 非美语义色未动（改动须同时过 CONCEPTS）。3D 场景同浅：背景/雾 `#f4f6f9`、轴/环钢蓝 `#3b6ea5` 系、切片面 `#e4ebf2`、描边 `#8fa3b6`。

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#f4f6f9` | 全幅工程底、开屏底 |
| `--panel` | `#ffffff` | 实心面板 |
| `--stroke` | `#c8d1dc` | 细边 |
| `--text` | `#17202b` | 主字 |
| `--muted` | `#5a6a7d` | 次字 |
| `--accent` | `#0d9d6b` | 强调、激活 chip、字标下划线（白底加深版） |
| `--us` / `--intl` | `#3cf0ff` / `#ffb020` | **数据语义色**（概念归属 CONCEPTS；美工部不单方面改） |
| `--glass` | `rgba(255, 255, 255, 0.55)` | 浮层 |
| `--glass-strong` | `rgba(255, 255, 255, 0.78)` | 搜索 / 帮助等稍实浮层 |

禁止默认滑向：紫靛渐变主题、暖奶油底+衬线+陶土强调、报纸密栏；避免无必要 glow 堆叠与圆角胶囊滥用（chip 已有形态可沿用）。

### 构图

- **立方体全幅**：`#viewport` 吃满窗口；无左右实心导航栏。
- **立方体视觉（2026-10-07 业主明示，五改）**：只保留切片面（浅灰蓝 0.08、聚焦 0.14）+ 公司平面圆 + **大大放大的环节标签**（白胶囊 4.4×0.78 用户单位、56px 字）。**标签每帧动态避让**：投影锚点到屏幕后贪心堆叠，任何间距/视角不重叠；每张标签一根**细钢蓝引线**动态连到自己切片顶边（直线、逐帧更新）。公司圆 **颜色=环节渐变**：电力端深蓝 `#0b3d8c` → 模型端浅蓝 `#93bce4`；直径=市值 log。**HUD 改左侧竖列**：按钮/图例/d 滑块/筛选模块（Stage 下拉=聚焦环节；Revenue US$B min≥/max≤ 区间筛选+清空）。详情面板 430px。焦点=切片留原处、其余沿 −x 左移淡出。默认间距 d=2.5（滑块 0–400%）。
- **环节选择前置页（C-GATE，2026-10-07 业主明示，二改全屏）**：整页铺满 `#viewport`（白底 `--bg`）。顶部品牌条：FIDV 衬线字标+accent 下线、副题「AI Industry Chain · 产业链环节选择」、右「Overview 全景」；左栏 350px 纵向环节列表（**编号从 1 起**，accent 数字+英文名+中文副题，悬停高亮、选中 accent 左竖条）；右侧介绍区（大标题+中文副题+blurb+长文介绍 14.5px/1.85+上游/下游两个信息盒+绿色实心 Enter 按钮）；底部通栏页脚（链条方向与操作提示）。移动端上下两栏。
- **浮动 chrome**：搜索置顶、详情右浮、HUD 底浮；玻璃 + 轻 `backdrop-filter`；空白处 pointer-events 透给 canvas。
- **帮助默认关**：`?` 打开，不常驻挡视野。

### 字标与开屏（C-SPLASH）

- 居中 **FIDV** 衬线字标（Iowan / Palatino / Georgia 栈）+ 左侧三片薄切片意象 + accent 细线。白底版字标深字（`#17202b`）。
- 入场：约 **0.4s** 轻淡入（`splash-in`）。
- **仅挂在工程首页 `/`（C-HOME）**：清晰态维持约 **2s**，再 **约 4s** opacity 淡出（JS fade fallback **4200ms**）。开屏期实心 `--bg` 盖住门厅，避免与 `.home-logo` 双标叠影；淡出后再露格阵。`?bics=` 下钻不重播。
- **进 `/cube`（含分类入口）不播开屏。**
- 无转圈、无 Loading 长文案、不画视空间球。

### 启动图标

- 暗底上三片纵切片 + accent 细线，与 splash 左标同族。（白底版未重绘图标，待美工部下次按新色板延展。）
- 源与产物：`ai-chain/assets/fidv-launcher-1024.png`、`fidv-launcher.icns`。
- 施加：`ai-chain/scripts/set-command-icon.sh` → `Open-AI-Chain.command` 与根 `Open-AI-Cube.command`。
- Git 不保证 resource fork；克隆后需重跑脚本。

### 工程首页（C-HOME）

- `/`：BICS L1–L3 同一门厅。先 **C-SPLASH**（仅冷进 `/`），再字标同族 + **固定左上**坐标痕迹（`.home-trail-fixed`，`top:14px; left:20px`；钻入不挪位）+ 页眉一枚玻璃链 **Decision cube** + 一枚玻璃直角 **上市地下拉**（关闭面当前国名+角标数；打开后最上搜索、下列 All/各国+角标数）+ 页级公司总数（控件外 muted 一行）+ **相连规则矩形格**（格右上角收录数；格底行业坐标 **只画 4 段** muted tabular，不因变短改字号）。`--accent` 只用于 hover/focus 与字标下划线。无底栏 chip CTA。无新闻。
- **L4 格进 `/list?bics=`（C-LIST）**，不再下钻 L5–L7，也不因该格是叶而进立方体。浅于 L4 的叶仍可 `/cube?bics=`。
- `/cube`：决策立方体冷启动，**无** splash。

### 四级名单（C-LIST）

- `/list?bics=`：门厅同族（`home-body`、字标、`.home-trail-fixed`、上市地下拉），**无开屏**。名/ticker 筛（`.list-filter`）与国别搜索分属两控件。
- 公司为细线行表（共边 1px `--stroke`，无胶囊）。一行一企。名 `--text`；ticker / 坐标 / 主业 L1 占比 `--muted` tabular。其他一级 + % 用名下 muted 字链（` · `），无 chip。窄屏旁注仍跟在名下。
- 筛名/ticker：trail 下一条细边输入，不搬立方体顶栏搜索皮。
- 空态一条 muted 短句。
- 同一 L4 码保留进立方体：品牌头一枚玻璃链 **Decision cube** → `/cube?bics=`，与首页同一控件；无页底第二条、非 chip 条。

---

## 2. 延展原则（新功能 / 新分页）

1. **先复用 token**：新面只用上表 CSS 变量，不引入第二套色名。
2. **浮于工程区**：新面板默认玻璃浮层，不恢复实心双栏。
3. **一字标族**：品牌露出用 FIDV 字标或切片意象，不另做吉祥物。
4. **动效克制**：以 opacity / 轻微 scale 为主；不为装饰加粒子或 3D logo。
5. **语义色不动**：US / 非美 / 环导读色变更须同时过 CONCEPTS，不单走美工部。

---

## 3. 管辖路径（文档归属；本次不搬目录）

| 资产 | 路径 |
|------|------|
| 色板 / chrome / 首页 | `ai-chain/web/css/app.css`；`ai-chain/web/index.html`（C-HOME + C-SPLASH）；`ai-chain/web/js/home.js` |
| 四级名单 | `ai-chain/web/list.html`；`ai-chain/web/js/list.js` |
| 立方体壳 | `ai-chain/web/cube.html`（C-CUBE；无 splash） |
| splash 时序 | `ai-chain/web/js/home.js`（hold ~2s → fade ~4s） |
| 面板类名与 HUD 外观 | `ai-chain/web/js/ui.js`（视觉层） |
| 启动图标 | `ai-chain/assets/fidv-launcher*` |
| 图标脚本 | `ai-chain/scripts/set-command-icon.sh` |
| 启动器附着面 | `ai-chain/Open-AI-Chain.command`、`Open-AI-Cube.command` |
| 概念续工指针 | `ai-chain/CONCEPTS.md` §10（美学细节回指本文） |

**不独占：** `coords.js`、抽出/焦点几何、`scene.js` 中服务坐标可读性的材质逻辑。

---

## 4. 与其它角色

| 角色 | 关系 |
|------|------|
| 总监 | 有代码改动时仍终审 DESIGN；美工部不写「通过/打回」 |
| 总参谋部 | 可在规划中调度美工部；业主安排下可规划管理美工部角色文件；美工部仍只出方案不改仓；产品终审仍归总监 |
| 书记 | 美工部不写 worklog |

*Last updated: 2026-10-03 · 首版由总参谋部立美工部时写入现行语言。*
