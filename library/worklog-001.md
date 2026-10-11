# worklog-001 — GOOGL / AI Chain Cube / FIDV
更新：2026-09-27 · 账号 GitHub `Franzpur` · 本机路径见文末

格式：`U=`用户简令 · `A=`我方简应 · 够后续接续即可。

---
> **主仓已迁至 FIDV**（本文件随仓）。本机克隆：`/Volumes/DATA/ANA_RSLT/FIDV`（或工作区根）。原 `ANA_RSLT` 仅作数据邻接盘；开发以本仓为准。
>
> **概念靶向库**：[`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) — 切片/轴/抽出/标准视角等中英对照；续工必读。

---

## 1. 对话流水（压缩）

### 阶段 A — GOOGL 财务（2026-09-25）
| # | U | A |
|---|---|---|
|1| 读同级 `googl example`，讲财务整体、最大风险、如何诊断阻断、如何安全充裕融资 | 读表/PDF；概括盈利与现金流强、云与广告结构；风险：监管/广告周期/AI capex 与供应商集中；诊断指标与融资结构建议（债股、期限匹配等）。另有 canvas 类分析产物。 |

### 阶段 B — 3D 产业链立方体立项（09-26）
| # | U | A |
|---|---|---|
|2| 据 `GOOGL_SA`/`GOOGL_SUPPLY` 做**可互动三维**散点切片立方体：点=公司；多层=产业链环节；从**电力**到 **OpenAI/Anthropic**；偏美国，非美用别色 | 单文件 `ai-chain-cube.html`：Three.js + OrbitControls；11 层；青=US / 红=非美；金环=SUPPLY 量化供应商；启动用 `Open-AI-Cube.command` + 本地 http。 |
|3| 架构好但大量 `?????` 乱码/空内容 | 中文→英文 UI/文案，修编码。 |
|4| 改进拖拽导航；补公司名/数据源标签 | 加控制说明、搜索、详情面板、数据源字段。 |
|5| 无法正常显示 | 修 importmap / 字面 `\nimport` 等加载错误。 |
|6| 在这边打开给我看；本地服务器可能被关 | 起 ruby httpd（曾用 **8767**），浏览器打开。 |
|7| 左键红屏；左右键应切切片；点太大 | 点选用 pointerup 阈值阈值；`[`/`]` 切层；缩小球半径。 |
|8| 变成平铺平面，要有层次的立方体 | 切片改为 **YZ 墙沿 X 堆叠**；等轴测默认相机；框线辅助。 |

### 阶段 C — 视觉与环尺度迭代（每步先备份）
| # | U | A |
|---|---|---|
|9| 备份后：点球荧光蓝/红；切片深蓝 | 备份→`…backup-20260926.html`；材质 emissive 加强。 |
|10| 再存档；按企业体量（营收）在切片内画**同心圆**定位 | 备份 glow；层内 min-max→0–100→10 环；外环低分、内环高分。 |
|11| 副本3；环要更亮；领域名要显示，不要 1–11 | 备份 rings；环线提亮；域名 canvas 标签。 |
|12| 副本4；选中一切片时**他环变暗**；公司/领域名**贴切片平面**不跟视角转；**Q 左旋 / E 右旋** | 备份 labels→4；关 CSS2D billboard→`PlaneGeometry` 共面；离焦环 opacity↓；`root.rotation.y` +=Q / −=E。 |
|13| 体量=100 的公司不在圆心；切切片时**视角勿瞬移** | score100→`ring=10` 原点；去掉选层时的 `cameraToLayer`。 |
|14| 副本5；半小时：①改善 UX ②拆文件架构+后端库撑前端 | 备份5；建 `ai-chain/` 包（见下）。 |

### 阶段 D — 架构与运维
| # | U | A |
|---|---|---|
|15| （系统）8767/8787 任务中止通知 | 确认后按需重启；后用户要求停服。 |
|16| 先别跑，停终端；自己点 bundle/command 打开 | kill **8787/8767**；入口改 `ai-chain/Open-AI-Chain.command`（根 `Open-AI-Cube.command` 转发）。 |
|17| 移植到已绑定 GitHub；进 **FIDV** 主干 | 装 `gh`→device login；账号 **Franzpur**；仓 `Franzpur/-Financial-Information-To-Decision-Visualization-FIDV-`；`ai-chain/` 推 **main** `37d0cf1`。 |
|18| gh 授权码有没有给我 | 有：当时 `27CB-90E4` + device URL。 |
|19| diff-tab：建分支并提交、**勿推** | 本地仓 `/Volumes/DATA/ANA_RSLT`：分支 `cursor/ai-chain-modular-cube`，commit `1ff981d`（未推）；排除 `_fidv_push/`。 |
|20| 写工作日志（本文件） | 写 `WORKLOG.md`。 |


### 阶段 E — 坐标/视角/交互 UX（09-26→09-27）
| # | U | A |
|---|---|---|
|21| 轴命名、原点、抽出方向、角视图镜像、非美橙、遮挡/dim、轨道/滚轮 | 用户轴 s/x/y；抽出沿 +x [0,1]→[1,2]；`USER_X_SIGN=-1`；角视图镜像；橙非美；透明 dim；距离缩放 rotateSpeed；指数滚轮。 |
|22| 继续按理解优化 UX，给足权限与时间 | 平滑相机动画；Esc 分层清除（选中→焦点）；点击切片平面聚焦；抽出缓动；聚焦边框高亮；中键/Home/V 角视图；双击空白清除；状态栏提示 pulled x∈[1,2]。 |


### 阶段 G — 债券现金流展开图视觉（09-29）
| # | U | A |
|---|---|---|
|24| 债务支出展开可视化测试继续完善，目前不够美观 | 季度柱按年成组；利息青 / 本金琥珀（对齐立方体色）；2060+ 残段拉开；左侧总额与占比、右侧分期账本与迷你构成条；选中列压暗其余。模块仍在 `googl-bond-cf/`。 |
|25| 利息支出置下，本金支出置上 | 堆叠柱对调：青色利息贴基线，琥珀本金在上。 |
|26| 债务展开要接到 chain cube：点切片再点 GOOGL，视角右转 90° 出财务切片，勾线同同心环，不要左右两栏 | 点 ticker GOOGL 时在点球处立财务切片（法向 user-x）；相机从正对产业链切片右转 90° 正对它；同心环同款描边；利息在下、本金在上。数据 `/api/googl-bond`。独立两栏页仍留在 `googl-bond-cf/`。 |
|27| 按第一版理念整理工程：一个决策视图、结构清楚、能跑 | 债务表拆到 `financeSheet.js`，度量进 `coords.js`。立方体是唯一决策视图；`googl-bond-cf/` 只产债务序列，扁平页只核数。 |

### 阶段 F — 概念靶向库（09-27）
| # | U | A |
|---|---|---|
|23| 建中英对照概念库（切片/点球/轴/抽出/标准视角等），代码标注，保移植可续 | 写 `ai-chain/CONCEPTS.md`；`scene.js`/`state.js`/`ui.js` 加 `[C-*]`；README/WORKLOG 挂链；刷新冻结约定。 |

### 阶段 H — 子代理与三类坐标（10-02）
| # | U | A |
|---|---|---|
|28| 确认 DESIGN.md 是判断标准：通过不给建议；需改进则写总监建议发回主代理；对话栏写一次通过或第几次打回；最多三次打回 | 任务：把这条写进总监。主代理改 `agents/chief-inspector.md`，补 `agent_tasklist/RULE.md`（`.cursor` 为点开头的隐藏目录）。无子代理。 |
|29| DESIGN.md 在哪，把它调出来 | 任务：放到能打开的位置。主代理从分支 `cursor/googl-bond-cashflow` 提交 `25283c9` 调出，先放仓库根目录。无子代理。 |
|30| 子代理与子代理任务库分开；把 DESIGN.md 移进任务库，以后新建子代理先放对应任务 | 任务：明确目录，DESIGN.md 作为总监的任务。主代理：`agents/` 放角色，`agent_tasklist/` 放任务；现为 `agent_tasklist/DESIGN.md`。无子代理。 |
|31| 根目录和里面的 FIDV 重复。找出先进改动合到根目录，删掉里面那层 | 任务：对照两份工作区，合并更新的文件，删除内层仓库。主代理：根目录坐标更新；债券文件取自提交 `80c7835`。已删 `/Volumes/DATA/FIDV/FIDV`。无子代理。 |
|32| 同时删除 googl-bond-cf 和 Open-Bond-CF，并删除主工程中点击 GOOGL 视角转向，以后重做 | 任务：删债券模块与启动器，确认当前主工程没有该转向。主代理已删 `googl-bond-cf/` 与 `Open-Bond-CF.command`，README 去掉对应说明。当前 main 工作区无按 GOOGL 单独转向；该代码只在未检出分支 `cursor/googl-bond-cashflow`。无子代理。 |
|33| 有代码更改必须调出总监，不能懒 | 任务：把已改的代码送审。主代理在第 1 次打回后把环上 x、y 改名为 ringCos、ringSin。总监第 1 次打回（x、y 不能兼指环上 cos/sin）；第 2 次送审通过。 |
|34| 用户坐标为 1 类位置坐标，环上为 2 类相对坐标；新建 3 类法人坐标（00-00-00-00-00-00-0000，对应 Bloomberg BICS，值待填），并建 3 类坐标库与 BICS Classification | 任务：先审计划，通过后写入。主代理写入 `ai-chain/CONCEPTS.md`、`ai-chain/web/js/coords.js`；各企业 `legalEntityCoord` 为空；库在 `3类坐标库/BICS Classification/待填.txt`。总监计划一次通过；写入后第 2 次送审通过。 |
|35| 总监改为代码改完后的最后一步，讨论规划时不调；有代码修改必须调，没有例外 | 任务：改用法条文。主代理写入 `agent_tasklist/RULE.md` 与 `agents/chief-inspector.md`。无子代理。未改产品代码，未调总监。 |
|36| 有没有负责记工作日志的子代理 | 任务：回答。主代理：当时只有总监。无子代理。 |
|37| 写子代理书记 secretary，记录提问、任务、主代理和子代理的执行，简介但有重点、能回溯 | 任务：建书记及其任务。主代理写 `agents/secretary.md`、`agent_tasklist/secretary.md`，并链到 `.cursor/agents/secretary.md`。无子代理。 |
|38| 这个执行方式是对的。书记每个谈话都要出现，比总监更根本，但不参与决策；只在谈话的最后出现，是最后一个任务 | 任务：写入用法，并作为本次谈话最后一项记下。主代理改 `agent_tasklist/RULE.md`、`agents/secretary.md`、`agent_tasklist/secretary.md`、`agents/README.md`。无总监。本条由书记记入。 |
|39| 最后创建 library，作为书记的工作区，把包括 worklog 在内的记录性文档放进去。书记要看 worklog 是否过大，超过 1 万字就建第二册。worklog 分册为 worklog-xxx，xxx 是编号。 | 任务：建 library，把现有工作日志改为第 001 册，并写明换册规则。主代理：建 library/。原 WORKLOG.md 移为 library/worklog-001.md（未满 10000 字，未开第二册）。规则写入 agent_tasklist/secretary.md、agents/secretary.md、agent_tasklist/RULE.md。README 与 ai-chain/CONCEPTS.md 的链接改指向本册。无总监。本条由书记记入。 |
|40| 把今天的更改全部上传至 GitHub 并同步。 | 任务：提交并推到 origin/main。主代理：提交 ab8d71b，再与 origin/main 合并（冲突保留今天的位置坐标），合并提交 6414e30 已推送。未纳入 ai_chain.db 与 DATA-SPACE/。工作日志仍在 library/worklog-001.md。无总监。本条由书记记入。 |
|41| 创建子代理总参谋部 General Staff：读 worklog、concept 和工程结构，把自然语言要求拆成意志加任务列表；全新问题可提创新方案；产出规划下达执行代理；无权指导总监和书记。 | 任务：建总参谋部及其任务，并写明它不指挥总监和书记。主代理：写 `agents/general-staff.md`、`agent_tasklist/general-staff.md`，链到 `.cursor/agents/general-staff.md`；在 `agent_tasklist/RULE.md` 写明先规划、再执行。知识来源是 library 的 worklog、`ai-chain/CONCEPTS.md`、`README.md` 与 `ai-chain/README.md`。无总监。本条由书记记入。 |
|42| 再给总参谋部加两条限定：只在下达任务前用「报文」「报」「M」「Message」或直接呼出总参谋部时才执行；一旦执行，必须是第一个执行任务的代理。 | 任务：把这两条写进总参谋部的用法。主代理改 `agents/general-staff.md`、`agent_tasklist/general-staff.md`、`agent_tasklist/RULE.md`、`agents/README.md`。未呼出总参谋部去规划，所以没有派它。无总监。无子代理。本条由书记记入。 |
|43| 再加一个总参谋部呼出方式「电」。 | 任务：把「电」写进呼出词。主代理改 `agents/general-staff.md`、`agent_tasklist/general-staff.md`、`agent_tasklist/RULE.md`、`agents/README.md`。呼出词现为报文、报、电、M、Message，或直接呼出总参谋部。未派总参谋部去做规划。无总监。无子代理。本条由书记记入。 |
|44| 电总参谋部：以往抽出不好看。与其让切片抽出，不如整个立方体左移淡出、切片位置不变，并指导手下修改。 | 任务：总参谋部先规划，执行代理再改抽出。主代理：焦点切片留在原位；其余立方体沿 −s 退开一面宽并淡出；线框跟随；轴线留在原点；标准视角改瞄面心 x=0.5。改了 `ai-chain/web/js/coords.js`、`scene.js`、`ui.js`、`index.html`、`ai-chain/CONCEPTS.md`。浏览器点开第 11 层，状态栏为 slice stays · cube exits −s。临时服务器已停。总参谋部第一个执行，规划为沿 −s 退场。总监第 1 次送审通过。本条由书记记入。 |
|45| 电总参谋部：明确坐标与方向：x右，-x左，y上，-y下，s前，-s后。指称要改，刚才的抽出任务也要改。 | 任务：总参谋部先规划，再改概念与抽出轴。主代理：冻结 C-DIR。抽出改为沿 −x 退一面宽。改 CONCEPTS.md、coords.js（cubeExitX / sliceAnchor）、scene.js、ui.js、index.html。电力改为后（−s），不再叫左。状态栏为 cube exits −x (left)。临时服务器已停。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |
|46| 上传这些更改到 GitHub。 | 任务：提交并推到 origin/main。主代理：提交 99b39f8 已推送。内容含总参谋部、方向冻结（右=+x 左=−x 上=+y 下=−y 前=+s 后=−s）、抽出沿 −x 退场。未纳入 ai_chain.db 与 DATA-SPACE/。无总监。本条由书记记入。 |
|47| 把 3类坐标库 改成英文名，怕路径出问题。 | 任务：改目录名为英文，并同步概念里的路径。主代理：`3类坐标库/` → `class-3-coords/`；`BICS Classification/` → `BICS-Classification/`；`待填.txt` → `pending.txt`。`ai-chain/CONCEPTS.md` 的 C-COORD-3 Library 已改。旧 worklog 历史行未改。总监第 1 次送审通过。本条由书记记入。 |
|48| 电总参谋部：切片 x,y 顶点改为 10（单位长度缩为 1/10），s 单位长度也定为 1，与 x,y 一样。 | 任务：总参谋部先规划，再改单位与面跨度。主代理：FACE_SPAN=10，UNIT=FACE/10，GAP=UNIT；面心 (5,5)；cubeExitX=10。改 coords.js、scene.js、CONCEPTS.md、index.html。方向与 −x 抽出语义未改。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |
|49| 电总参谋部：取消选中后切片边缘绿色荧光高亮，改用选中前那种暗一些的蓝色边缘。 | 任务：总参谋部先规划，再改焦点边框色。主代理：scene.js 焦点边框不再用 0x8be0c0，始终 COLORS.EDGE，opacity 用 base。CONCEPTS C-EDGE 已同步。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |
|50| 电总参谋部：抽回应当有和抽出淡出一样的淡入动画。 | 任务：总参谋部先规划，再把抽回做成与抽出同档的缓动。主代理：scene.js 用 exitStayLayer 让抽回位移跟 cubeExit 缓回；去掉透明度瞬拉；lerpVisibility 双向同档；金环也走 opacity lerp。CONCEPTS C-RETRACT/C-DIM 已同步。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |
|51| 电总参谋部：去掉 Alphabet/Google 相关公司外的黄环（早期遗留；产品将不止 Google）。 | 任务：总参谋部先规划，再去黄环。主代理：去掉 Torus/COLORS.SUPPLY/supply 筛选与图例；点半径固定 0.022；保留 valueM 与详情。改 scene.js、state.js、index.html、app.css、CONCEPTS.md（C-SUPPLY/C-FILTER）。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |
|52| 电总参谋部：建视空间——原点球；相机最远拉回；半径优先 x=y=s=100。 | 任务：总参谋部先规划 C-VIEW-SPACE（R=100 用户单位，maxDistance=R·UNIT；不画球；轴不变；硬壳原点延后），再执行。主代理：LAYOUT.viewSpace/viewSpaceMeters→coords.js；scene.js maxDistance/fog/far；CONCEPTS C-VIEW-SPACE；index lede。总参谋部第一个执行。总监第 1 次送审通过。本条由书记记入。 |

---

## 2. 当前真源结构（以这个为准）

```
/Volumes/DATA/ANA_RSLT/
  library/worklog-001.md     ← 本日志（书记工作区 library/）
  Open-AI-Cube.command       ← 转发到 ai-chain 启动器
  ai-chain/                  ← 【主工程】
    Open-AI-Chain.command    ← 双击即可：seed + server :8787
    data/{layers,companies}.json + ai_chain.db
    server/{app.py,db.py}    ← stdlib HTTP + SQLite
    web/{index.html,css/,js/}← api/state/scene/ui/main
    scripts/seed.py
  _fidv_push/                ← FIDV 远程克隆（勿当源；.gitignore 已排）
```

**GitHub FIDV**：  
https://github.com/Franzpur/-Financial-Information-To-Decision-Visualization-FIDV-  
路径：`ai-chain/` on `main`

**本地 git（ANA_RSLT）**：分支 `cursor/ai-chain-modular-cube` @ `1ff981d`（root commit，未推远程）

**旧单文件**：曾用 `ai-chain-cube.html` + `ai-chain-cube.backup-20260926{,-glow,-rings,-labels,-4,-5}.html`；工作区现可能已不在（以备份/历史为准）；逻辑已迁入 `ai-chain/`。

---

## 3. 产品约定（续做时勿回退）

| 项 | 约定 |
|----|------|
| 层序 | 0 Power → … → 10 Models（OpenAI/Anthropic 端）共 11 |
| 颜色 | US `#3cf0ff`；非美 `#ffb020`（荧光橙黄）；SUPPLY 金环 |
| 营收环 | 层内 min-max→0–100；0–9.9 最外；90–99.9 近心；**100=圆心** |
| 标签 | 贴 YZ 切片平面，不 billboard |
| 焦点 | 选切片：他环/他层变暗；**沿蓝/`x` 抽出**；切层/抽回**保持相机**；`Esc` 分层清除 |
| 坐标 | 用户轴 `(x,y,s)`（与同心环同色系）。原点左下。抽出：x∈[0,1]→[1,2]。详见 CONCEPTS.md |
| 标准视角 | 抽出：`(1.5,0.5,s*+10)` 朝 −s；总览：`(2.1,2.1,24)` 朝原点；快捷键 **C** / 中键 |
| 键位 | Q/E 偏航；WASD 平移；R/F 推拉；**C** 标准视角；`[`/`]` 切层；`Esc`；`?` 帮助（角视图 V 已废） |
| 端口 | 新栈 **8787**；旧静态曾 **8767**（可弃） |
| 服务 | **默认不常驻**；用户自点 `.command` |

---

## 4. API 速查

- `GET /api/bundle` 启动包（layers+companies+meta）
- `GET /api/layers` · `/api/companies?layer=&country=us|intl&supply=1&q=` · `/api/companies/:id` · `/api/health`
- 环坐标在**服务端** `db.assign_rings` 算，过滤不改变相对位置

---

## 5. 数据注意

- `GOOGL_SUPPLY.xlsx` → `value_m` 与金环；其余 Public industry map
- `GOOGL_SA.pdf` = 2020 方法论文，**不是**公司名单
- 收入 `rev_bn` 为示意年化十亿美元，非审计数；切片内位置为示意+环尺度

---

## 6. 未决 / 可续

- [ ] FIDV README 与本地 `WORKLOG` 是否再同步推一版
- [ ] 旧 `ai-chain-cube*.html` 备份是否归档进仓或 DATA 盘
- [ ] UX 可再加：切片切换动画、导出、更多数据源接入
- [ ] Git 提交者身份目前是本机自动 `Hugo SUI <hgsui@…>`（未改 global config）
- [ ] 用户偏好：中文沟通；researcher；直接改代码迭代

---

## 7. 一键续工

```bash
cd /Volumes/DATA/ANA_RSLT/ai-chain && ./Open-AI-Chain.command
# 或
python3 scripts/seed.py && python3 server/app.py   # http://127.0.0.1:8787/
```

接话时先读本文件 + `ai-chain/CONCEPTS.md` + `ai-chain/README.md`，再动代码。
