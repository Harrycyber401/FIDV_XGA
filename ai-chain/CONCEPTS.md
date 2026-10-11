# AI Chain Cube — Concept Target Library  
# 产业链立方体 — 概念靶向库

> **Purpose / 用途**  
> Bilingual glossary of *agent-pointing* concepts for this module.  
> After archive, port, or long pause: **read this file before changing 3D/UX code**.  
> 中英对照；封存、移植或隔久再开时，**先读本文再改三维/交互**。  
>
> **Canonical home / 真源**  
> Repo: FIDV · path: `ai-chain/` · entry: `Open-AI-Chain.command` · port **8787**  
>
> **Code tags / 代码标注**  
> Comments use `[C-ID]` matching rows below (e.g. `[C-SLICE]`, `[C-STDVIEW]`).

---

## 0. How agents should use this / 智能体用法

| Step | EN | 中 |
|------|----|----|
| 1 | Resolve user words → concept ID | 把用户口语映射到概念 ID |
| 2 | Prefer IDs over synonyms in edits | 改代码时用 ID，勿混用近义词 |
| 3 | Do not break “Frozen rules” | 勿违反「冻结约定」 |
| 4 | Update this file when a new lasting concept appears | 出现可复用新概念时同步更新本文 |

---

## 1. Scene objects / 场景对象

| ID | EN | 中 | Meaning / 含义 | Code anchors / 代码锚点 |
|----|----|----|----------------|-------------------------|
| **C-CUBE** | industry-chain cube | 产业链立方体 | Whole 3D stack of **slice faces** along **s** (2026-10-07 业主明示：云图改回三轴切片图). Page still `/cube` | `buildCube`, `root` |
| **C-SLICE** | slice / stage | 切片 / 环节 | One YZ wall = one industry stage; index `i` = user **s\***; companies sit ON the face | `ctx.planeGroups[i]`, `state.layers[i]`, `state.focusLayer` |
| **C-POINT** | company dot / flat disc | 公司圆点 | One company as a billboard **flat 2D disc** on its slice face; **diameter = market cap log scale** (no Bloomberg row → revenue proxy, labeled); **color = stage gradient: power (s=0) deep blue → models (s=10) light blue** | `ctx.sprites`, `ctx.byId`, `companySizeUser`, `makeDotTexture`, `stageColorHex` |
| **C-RING** | concentric ring | 同心环 / 营收环 | In-slice radius from revenue score 0–100; ring 10 = exact center. **Placement only** — guide lines are not drawn | `revScore`, `ringCos`, `ringSin`, `companyCoord` |
| **C-GATE** | stage chooser | 环节选择前置页 | Pre-cube **full-viewport** page at `/cube` (cold boot, unless `#slice=` / `#id=` deep link): the 11 stages listed **vertically** with **1-based numbering**; click a row shows its curated intro beside (zh editorial + blurb + upstream/downstream boxes); second click / dblclick / Enter button focuses that slice (pull + face-on standard view). HUD chip **← Stages** reopens it; **Overview 全景** returns to the full cube. Intros: `web/js/stage-intros.js` (editorial, not Bloomberg data). | `#stageGate`, `ui.js showGate/enterStage`, `stage-intros.js` |
| **C-SPINE** | stage tags + leader lines | 环节标签 + 引线 | **Big** clickable stage tags (`i+1 · name`, 1-based; sprite 4.4×0.78 用户单位、font 56). **Dynamic layout every frame** (`layoutTags`): slice-top anchors are projected to screen, tags stack upward with greedy collision avoidance — never overlap at any spacing d or camera angle. Each tag has a **thin steel-blue leader line** from its slice top to the tag, updated per frame; tag/lines hide when the anchor is off-screen or behind the camera. | `ctx.tagSprites`, `layoutTags`, `tag.userData.leader` |
| **C-SUPPLY** | Alphabet supplier data | 谷歌供应链 | `valueM` rows are **real Bloomberg GOOGL_SUPPLY data**; shown in the detail panel only — **no link lines drawn** (2026-10-07, owner) | `valueM` |
| **C-LINK** | chain texture link | 链纹理链接 | Former faint adjacency lines — **not drawn** (2026-10-07, owner) | — |
| **C-LABEL** | billboard label | 广告牌标签 | Company name pill on hover / select / stage focus; stage tags are billboard pills (text `i · name`) | `ctx.labelSprites`, `makeTextTexture` |
| **C-EDGE** | slice edge | 切片描边 | Removed (2026-10-07, owner: no line chrome; the face itself is the click surface) | — |
| **C-AXES** | user axes | 用户坐标轴 | x/y axis lines not drawn; only the chain spine marks **s** | `rebuildSpine` |
| **C-COORD** | position coordinate `(s, x, y)` | 1类坐标 / 位置坐标 | User coordinate. The only placement language in the cube. `x` and `y` mean only this. Edit `LAYOUT` or an object's coord; do not place with raw Three XYZ | `coords.js`, `applyCoord`, `applySliceCoord` |

**Synonyms to normalize / 口语归一**

- 环节 = stage = layer = 层（云图里一层=一片公司光点聚团；切层靠点阶段标签 / `[` `]` / 搜索）  
- 光点 = 点 = dot = company point（不是球；广告牌光斑 sprite）  
- 环 = concentric ring（历史词：服务端仍算 ring/ringCos/ringSin，云图不用、不画线）  
- 布局坐标 = 用户坐标 = 1类坐标 = 位置坐标 `(s, x, y)`（云图散点 `cloudCoord` 生成，种子=公司 id，稳定不漂）  
- 环上坐标 = 2类坐标 = 相对坐标 `ringCos` / `ringSin`  
- 行业坐标 = 3类坐标 = industry coordinate = `legalEntityCoord`（BICS；旧称「法人坐标」仍可口语，字段名未改）  
- 右 = +x；左 = −x；上 = +y；下 = −y；前 = +s；后 = −s  
- 电力端 = 后 = −s（小 s）；模型端 = 前 = +s（大 s）。勿把电力叫「左」
- 视空间 = 视野球 = view space = max pull-back（半径默认 200 用户单位）
- d = 环节间距因子 = stage gap factor（默认 2 = 200%；UI 0%–200%）

---

## 2. Coordinate system / 坐标系

| ID | EN | 中 | Rule / 约定 |
|----|----|----|-------------|
| **C-USER-AXES** | user axes `(s, x, y)` | 用户轴 | Product language. Tuple order is **s, then x, then y**. **Not** raw Three.js XYZ. **Not drawn** (2026-10-07, owner: axes/wireframe removed for a clean view). |
| **C-DIR** | direction names | 方向指称 | **右=+x，左=−x，上=+y，下=−y，前=+s，后=−s**。口语「左」不得指电力端或 −s。 |
| **C-AXIS-S** | **s** (slice axis) | **s** 轴（切片轴） | Front / back. **+s** front, **−s** back. **1 s-unit = `UNIT`** (same meters as 1 x / 1 y). Layer index `i` ⇒ **s = i**. Power is back (small s); models are front (large s). Three.js **+X**. |
| **C-AXIS-Y** | **y** | **y** 轴 | Up / down on the face. **+y** up, **−y** down. **1 y-unit = `UNIT`**. Face spans **y∈[0,10]**. Three.js **+Y**. |
| **C-AXIS-X** | **x** | **x** 轴 | Right / left on the face. **+x** right, **−x** left. **1 x-unit = `UNIT`**. Face spans **x∈[0,10]**. Three.js **−Z** via `USER_X_SIGN = -1`. |
| **C-ORIGIN** | user origin | 用户原点 | Corner **(s, x, y)=(0, 0, 0)**. Three: `(−halfStack, −FACE/2, +FACE/2)`. |
| **C-VIEW-SPACE** | view space | 视空间 / 视野球 | Sphere about **C-ORIGIN**, radius **R** in user units (default **200**; `1 s = 1 x = 1 y`). Farthest camera pull-back vs OrbitControls `target` is `R · UNIT` (always **UNIT**, never multiply by **d**). Not drawn. Not axis length. | `LAYOUT.viewSpace`, `viewSpaceMeters`, `controls.maxDistance` |
| **C-MAP** | user → Three | 用户→引擎映射 | `coordToLocal` / `userToWorld`: `X += s·gap`, `Y += y·UNIT`, `Z += USER_X_SIGN·x·UNIT`, then `root.localToWorld` (honors Q/E yaw). `UNIT = FACE/10`; `gap = d·UNIT`. |
| **C-COORD** | position coordinate | 1类坐标 / 位置坐标 | User `(s, x, y)`. The only placement in the cube. `x` and `y` mean only this pair. A focused slice stays; `sliceAnchor` shifts the rest along **−x**. Company `coord` is the face position. |
| **C-COORD-2** | relative coordinate | 2类坐标 / 相对坐标 | Ring placement `ringCos` / `ringSin`. Not called `x` or `y`. `companyCoord` projects them into 位置坐标. |
| **C-COORD-3** | industry coordinate | 3类坐标 / 行业坐标 | One industry code per company (optional). **Authoritative:** Bloomberg BICS Equity Hierarchy 2024 compact `bicsCode` (length `2×level`, levels 1–7). **Product field** `legalEntityCoord`: stored as fixed **7×2** hyphenated segments, right-pad `00` for shallow leaves (e.g. leaf L4 → `10-10-13-12-00-00-00`). **If the winning membership has empty `% Tot Rev`**, the **entity** coord in list API is `'-'` + that 7×2 (e.g. `-50-12-10-10-00-00-00`); hierarchy **node** coords stay unsigned. **Gate / list chrome shows the first 4 groups only** and **keeps a leading `-`** (`-50-12-10-10`); L5–L7 including pad `00` are hidden, not deleted. Empty `%` is not 100. May hang a non-leaf code (= coarser class). Library: `class-3-coords/BICS-Classification/`. **Not a position, not drawn on the cube.** |

```
User (s, x, y)   Three.js (under root)
─────────────────────────────────────
+s  (ice)        +X
+y  (steel)      +Y
+x  (ring blue)  −Z  (USER_X_SIGN = -1)
```

Position changes go through `ai-chain/web/js/coords.js` (`LAYOUT`, or an object's `{s, x, y}`). Scene code calls `applyCoord` / `applySliceCoord`.

**Do not / 禁止**

- Do not call user-**x** “depth in Three +Z” without `USER_X_SIGN`.  
- Do not treat **s\*** as world meters; it is **layer index / gap units**.

---

## 3. States / 状态

| ID | EN | 中 | State field / 字段 | Behavior / 行为 |
|----|----|----|-------------------|-----------------|
| **C-FOCUS** | focused slice | 焦点切片 | `state.focusLayer = i \| null` | One slice stays put; the rest of the cube shifts along **−x** (left) and fades. |
| **C-SELECT** | selected company | 选中公司 | `state.selectedId` | Detail panel; dot scales 1.5; name label on. Esc clears this first. |
| **C-HOVER** | hover | 悬停 | `state.hoverId` | Tooltip + name label + dot scales 1.25. |
| **C-DIM** | off-focus fade | 离焦淡出 / 抽回淡入 | — | Non-focus slices fade to opacity 0. Retract fades back to resting opacity on the same lerp as exit. Materials stay `transparent` while fading. |
| **C-FILTER** | filter | 过滤 | `state.filterMode`, `state.revMin`, `state.revMax`, `state.focusLayer` | Left-panel filter module: `all`/`us`/`intl` chips; **Stage 下拉**（= `focusLayer` 双向同步，筛某个产业链）；**Revenue 营收（US$ B）** min≥ / max≤ 双输入（大于/小于/区间），实时隐藏不匹配圆点并同步环节表与状态栏；hash `rmin`/`rmax` 持久化 |
| **C-D** | slice gap factor | 切片间距 d | `state.d` | Default **2.5** (= 250%). Meters between slices = `d · UNIT`. UI slider 0%–400% → `d ∈ [0, 4]`. |

**Esc hierarchy / Esc 分层** `[C-ESC]`  
1) clear **select** → 2) clear **focus** → keep camera.

---

## 4. Actions / 动作

| ID | EN | 中 | What happens / 效果 | Code |
|----|----|----|---------------------|------|
| **C-PULL** | cube exit | 抽出 | Focused slice stays at its **s** and **x∈[0,10]**. The rest of the cube shifts together along **−x** (left) by `cubeExitX()` (= `FACE_SPAN` = 10) and fades out. | `lerpPullOut`, `sliceAnchor`, `cubeExitX` |
| **C-RETRACT** | retract | 抽回 | Focus cleared; the cube eases back along **+x** and fades in on the same timing as exit fade-out (`lerpPullOut` + `lerpVisibility`). **Camera must not auto-yaw toward origin.** | `focusStage` toggle / `clearFocus` |
| **C-PULL-ZONE** | pull-frame hit zone | 抽出点击区 | Square∖disk on slice face: inside 1×1 square, **outside** outermost ring. Misses inside the ring do **not** toggle focus. Tested in user `(s, x, y)`. | `isPullFrameHit`, `LAYOUT.ringRadius` |
| **C-FOCUS-ACT** | focus slice | 聚焦切片 | Set `focusLayer`; the slice stays, the cube exits; its tag scales up, its company labels turn on; the detail panel shows the **stage card** (intro, chain map, upstream / downstream, roster). Via tag/plane click, `[` `]`, or pick/search a company on that slice. | `focusStage` |
| **C-PICK** | pick company | 点选公司 | Raycast dot disc → select + focus its slice + frame the dot. Plane/tag click only if dot missed. | `pick`, `selectCompany` |
| **C-STDVIEW** | standard view | 标准视角 | Snap camera to canonical pose for current focus state. Hotkey **C** / button / middle-click. | `goStandardView`, `standardPose` |
| **C-RESET** | reset view | 重置 | Clear focus/select; go standard overview pose. | `resetCamera` |

**Camera rule / 相机约定** `[C-CAM-HOLD]`  
Changing or clearing slice focus **must not** animate orbit target into the cube interior. Only **C-STDVIEW** / **C-RESET** / explicit pick framing may move the camera.

**View space / 视空间** `[C-VIEW-SPACE]`  
Orbit dolly (wheel / **R·F**) clamps at `controls.maxDistance = LAYOUT.viewSpace.radius · UNIT`. Standard poses stay inside the ball (`‖overview‖≈38 < 200`). This edition limits distance to `target`, not a hard shell about the origin after pan.

---

## 5. Standard view poses / 标准视角位姿 `[C-STDVIEW]`

User coordinates `(s, x, y)`. Looking direction via OrbitControls `target`. Numbers live in `LAYOUT.camera`.

| Mode | Camera `(s, x, y)` | Look-at | 中文说明 |
|------|--------------------|---------|----------|
| **Focused** (`focusLayer = s*`) | `(s* + 10, 5, 5)` | `(s*, 5, 5)` (from **+s** / front) | 从前方正对留在原地的面心（x=5, y=5） |
| **Overview** (no focus) | `(24, 21, 21)` | user origin `(0, 0, 0)` | 未聚焦总览 |

Removed / 已废弃：旧「角视图 corner view」与 **V / Home** 绑定（勿恢复 unless product asks）。

---

## 6. Controls / 操控

| Input | Action | Concept |
|-------|--------|---------|
| Left-drag | orbit (free drag) | — |
| Right-drag | pan (translate) | — |
| Scroll | exponential dolly | — |
| Middle-click | **C-STDVIEW** | standard view |
| **C** | **C-STDVIEW** | 标准视角 |
| **Q / E** | yaw whole `root` | — |
| **W A S D** | pan | — |
| **R / F** | dolly | — |
| **[ / ]** | prev/next focus slice | **C-FOCUS-ACT** + **C-PULL** |
| **Esc** | layered clear | **C-ESC** |
| **?** | help overlay | Default **closed**; chrome is floating over the full-bleed cloud (no solid sidebars) |
| HUD **d** slider | slice spacing 0%–400% (default 250%) | **C-D** |
| Left-panel **Stage** select | focus/filter that stage | **C-FOCUS-ACT** |
| Left-panel **Revenue** min/max ($B) | hide dots outside the range | **C-FILTER** |
| Click stage **tag** or slice **plane** | focus/toggle that slice | **C-FOCUS-ACT** / **C-PULL-ZONE** |
| Double-click empty | clear focus | **C-RETRACT** path |
| Click company dot | select | **C-PICK** |

---

## 7. Data concepts / 数据概念

| ID | EN | 中 | Notes |
|----|----|----|-------|
| **C-LAYER-DATA** | layer record | 层数据 | `layers.json` / API; order 0 Power → 10 Models |
| **C-COMPANY** | company record | 公司 | `revBn`, `revScore`, `ring`, `ringCos`, `ringSin`, `country`, optional `valueM`, optional `legalEntityCoord` / industry code (empty until attached), optional `bloomberg` — real 20261003 membership row attached server-side only on an exact `TICKER <venue> Equity` match that passes the name guard (see §9); absent → UI shows Not attached |
| **C-US / C-INTL** | US / non-US | 美 / 非美 | Filter only. Dots are **uniform deep navy** (`#1d4f8f`, flat discs — 2026-10-07, owner); stage gradient retired with the glow sprites |
| **C-HOME** | engineering home | 工程首页 | Gate at `/`: BICS **L1–L3** same board (`/?bics=`). Optional `?listingCountry=` (ISO or `UNMAPPED`) via a **searchable listing-country dropdown** (not a chip wall; not cube `?country=`). **Level-4** cell → **C-LIST**. Breadcrumb **fixed** top-left (`All / …`). Sector cells show **4-segment** industry coords (`displayIndustryCoord`) and subtree **company counts**. Header one **Decision cube** control → **C-CUBE**. Shallow leaves above L4 still `/cube?bics=`. Hosts **C-SPLASH** (cold `/` only). | `web/index.html`, `home.js`, `nations.js`, `GET /api/bics/children` |
| **C-LIST** | L4 company list | 四级公司名单 | `/list?bics=<L4 compact>` plus optional `?listingCountry=`. One company per full **Member Ticker**, only if this L4 is its **primary** (numeric `% Tot Rev` wins; empty still gets a primary via the same sort, entity coord prefixed `-`). Industry coord column uses **4-segment** chrome (keeps leading `-`). Other L1 shares as annotations. Country from yellow-key (see **C-LISTING**). No splash. Same header **Decision cube** as C-HOME. | `web/list.html`, `list.js`, `GET /api/bics/entities` |
| **C-LISTING** | listing country | 上市地 | ISO from Bloomberg yellow-key **exchange token** (second-last before `Equity`/`Corp`/…), mapped in `server/listing.py`. **Not** headquarters. **Not** an 8th industry axis. Unmapped venues stay **Unmapped**. Distinct from cube **C-US / C-INTL**. Changing country on C-HOME / C-LIST is in-page `history` + refetch — no document reload, no splash, keep board scroll. |
| **C-CUBE** | decision cube SPA | 决策立方体页 | Full-bleed cube at `/cube`. Optional `?bics=` context only. **No splash.** Not the L4 click target. | `web/cube.html`, `main.js` |
| **C-SPLASH** | splash | 开屏 | Only on **C-HOME**: FIDV wordmark → clear hold ~**2s** → fade ~**4s**. `/list` and `/cube` play no splash. | `#splash` in `index.html`, `home.js` |
| **C-RING-SCORE** | ring score | 环分数 | Per-stage min–max → 0–100; still computed server-side and shown in the detail panel; **not used for placement or size** in the cloud |

---

## 8. Symbol map / 符号对照（代码）

| Symbol | Concept ID | Note |
|--------|------------|------|
| `state.focusLayer` | C-FOCUS | `null` = overview |
| `state.selectedId` | C-SELECT | |
| `cloudCoord` | C-COORD | deterministic scatter generator — **unused since the cube returned** (2026-10-07); dots use `companyCoord` ring placement |
| `ctx.sprites` / `ctx.byId` | C-POINT | company flat navy discs on slice faces |
| `ctx.tagSprites` | C-SPINE / C-PULL-ZONE | clickable stage tags |
| `state.revMin` / `state.revMax` | C-FILTER | revenue range floor/ceiling, US$ billion; `null` = unset |
| `ctx.linksGroup` / `rebuildLinks` | C-LINK / C-SUPPLY | chain texture + real Alphabet supply lines |
| `USER_X_SIGN` | C-AXIS-X | `-1` |
| `FACE` | unit scale | physical meters per 10 user units — **6.0** (2026-10-07 业主明示：面放大，原 4.2；`UNIT = FACE/10 = 0.6`) |
| `FACE_SPAN` | unit scale | `10` — 1 class-coord face edge in user units |
| `UNIT` / `GAP` | C-AXIS-S/X/Y unit | meters per 1 user-s / x / y when **d=1** (`FACE/10`) |
| `state.d` / `gapMeters` | C-D | slice gap factor; `gap = d·UNIT`; UI % = `100·d` (default 250) |
| `LAYOUT.viewSpace` / `viewSpaceMeters` | C-VIEW-SPACE | user radius R (200); meters = `R·UNIT` |
| `controls.maxDistance` | C-VIEW-SPACE | = `viewSpaceMeters()` |
| `coordToLocal` / `userToWorld` | C-MAP | argument is `{s, x, y}` |
| `applyCoord` | C-COORD | placement API in the cloud scene |
| `company.coord` | C-COORD | 位置坐标 `(s, x, y)` from `cloudCoord` |
| `ringCos` / `ringSin` | C-COORD-2 | 相对坐标；仍由服务端算，云图不使用 |
| `legalEntityCoord` | C-COORD-3 | 行业坐标；库内节点 7×2 无符号；企业主业空 `% Tot Rev` 时名单字段前加 `-`；闸门/名单 **只显示前 4 段** 且保留负号（`displayIndustryCoord`）；权威码 `bicsCode` |
| `standardPose` / `goStandardView` | C-STDVIEW | |
| `focusStage` / `clearFocus` | C-FOCUS-ACT / C-ESC | |
| `lerpVisibility` | C-DIM / C-RETRACT | fade-out and fade-in share the same k |
| `companySizeUser` | C-POINT | market-cap log diameter; revenue proxy fallback |

---

## 9. Frozen rules / 冻结约定（续做勿回退）

1. 1类坐标 / 位置坐标 is **`(s, x, y)`**, not raw Three XYZ. `x` and `y` mean only this. Move things by editing coordinates in `coords.js`. 2类坐标 / 相对坐标 is `ringCos` / `ringSin`（服务端按营收环算，立方体用它把公司投到切片面上：`companyCoord`）. 3类坐标 / 行业坐标 is `legalEntityCoord`（BICS **存储** 7×2，库在 `class-3-coords/BICS-Classification/`；企业主业空占比时名单坐标加 `-`；**闸门与名单 chrome 只画前 4 段并保留前导 `-`**），不参与摆放。  
2. 立方体（2026-10-07 业主明示，四改）：只有**切片面**（`PLANE` 不透明度 0.08，聚焦 0.14）+ 公司圆点 + 环节标签。**不画**：s/x/y 轴、Wire 框、切片描边、链脊柱线、链纹理线、Alphabet 连线——从重叠视角也要保持干净明亮。−x 抽出聚焦（`cubeExitX`=10）。公司圆点经 `companyCoord` 落在面上；不画同心环导读线。  
3. Focus change / retract → **hold camera** (`C-CAM-HOLD`).  
4. Standard overview / focused poses stay as §5 until explicitly revised.  
5. Dimmed sprites need `transparent: true` or opacity is ignored.  
6. Labels are **billboard sprites**（公司名胶囊：hover/选中/环节聚焦显示；阶段标签胶囊可点击聚焦）.  
7. 光点 = **环节渐变平面圆**（无光晕）：电力端（s 小）深蓝 `#0b3d8c` → 模型端（s 大）浅蓝 `#93bce4`（2026-10-07 业主明示）；US/INTL 只剩过滤。  
8. Default: **do not leave :8787 running** unless user asks.
9. 公司详情面板只展示 20261003 彭博库中**精确 ticker+venue 匹配且名称防错配通过**的真实行（市值/行业收入/行业占比/BICS 行业与坐标）；无匹配显示 Not attached，**不造数不估算**。分段节点（同 ticker 不同营收，如 Samsung Foundry、Intel Gaudi/Xeon）不挂父行；同营收 facet 节点与唯一 ticker 放宽首词；ticker 出现在公司名中可过首词（AMD、SanDisk/WD）。
10. 白底主题（2026-10-07 业主明示）：背景/雾 `#f4f6f9`、脊柱/连线钢蓝系。
11. `valueM`（真实彭博 GOOGL_SUPPLY 数据）只在详情面板展示，**不画连线**；链纹理线已废（2026-10-07 业主明示「把坐标轴以及其他线全部删除」）。
12. 光点直径 = **市值 log**（`companySizeUser`，log10 8.5→12.7 映射 **0.30–0.70 用户单位**——面放大到 FACE=6.0 后按 4.2/6.0 比例缩小，保证点的物理大小不变）；无彭博行用营收代理，详情/HUD/悬停均标注依据。点球为**深蓝平面圆**（`makeDotTexture` 单纹理，无光晕无渐变，2026-10-07 业主明示）。左键拖动=旋转、右键=平移（自由拖视角）。默认 d=2.5（250%），滑块 0–400%。
13. 点击环节标签聚焦后，详情面板 = **环节卡片**：环节介绍（name/blurb）、链图（全环节名，当前加粗）、上游/下游环节及其介绍、本环节公司表。上下游只陈述环节顺序与 lay.json blurb 原文，不造关系数据。**展示编号一律 1 起**（层索引 +1）：前置页列表、介绍栏、环节标签、环节卡片与链图。
14. `/cube` 冷启动先进 **C-GATE 环节选择页**（全屏、纵向列出 11 个环节；点一下显示介绍，再点/双击/Enter 按钮进该切片并弹出聚焦）；hash 深链（`#slice=`/`#id=`）跳过前置页。HUD「← Stages」返回前置页。介绍文案在 `web/js/stage-intros.js`（策划性产业知识，非彭博数据）。
15. 左侧竖列（2026-10-07 业主明示）：按钮+图例+d 滑块+**筛选模块**。Stage 下拉 = 聚焦环节（与标签点击/[ ] 双向同步）；营收筛选以 **US$ billion** 为单位（min≥/max≤ 双输入即大于/小于/区间），过滤圆点可见性、环节公司表与状态栏计数，未知营收在设区间时隐藏。环节标签放大（4.4×0.78/56px）；详情面板 430px、环节卡片含中文长介绍。
16. 环节标签**每帧动态排布**（`layoutTags`，2026-10-07 业主明示）：锚点=切片顶边中点，投影到屏幕后贪心向上堆叠避让，任何 d、任何视角不重叠；每张标签用**细钢蓝引线**连到自己的切片顶边（逐帧更新，直线即可）；锚点在屏幕外/相机后时标签与引线隐藏。

---

## 10. Continuity pointers / 续工指针

| Doc | Role |
|-----|------|
| **This file** | Concept targets (agent-facing) |
| [`library/worklog-001.md`](../library/worklog-001.md) | Session asks/answers + history |
| [`README.md`](./README.md) | Run / API |
| `web/js/scene.js` | 3D + camera + pick (`[C-*]` tags) |
| `web/index.html` + `home.js` | **C-HOME** L1–L3 board + **C-SPLASH** + header Decision cube; L4 cells → **C-LIST** |
| `web/list.html` + `list.js` | **C-LIST** L4 company table (no splash) |
| `web/cube.html` + `web/css/app.css` | **C-CUBE** full-bleed cube; floating chrome; **no splash**; aesthetics → `agent_tasklist/AESTHETIC.md` |
| `web/js/main.js` | Cube boot only; reads `?bics=` |
| `assets/fidv-launcher*` + `scripts/set-command-icon.sh` | Launcher icons（美工部管辖） |
| `GET /api/bics/children` | C-COORD-3 children of `parent` (empty = L1) |
| `GET /api/bics/entities` | member companies whose primary L4 is `?bics=`（含空 `% Tot Rev` 胜出；此时 `legal_entity_coord` 带 `-`） |
| `GET /api/bics/node` | One BICS node by `code` (any level) |
| `GET /api/bics/l1` | Compat: L1 sectors only |
| 信息部 / `agent_tasklist/INFORMATION.md` | 数据目录、调用词条、乱缺建议、BQLX 公式方案 |
| `web/js/state.js` | Shared state |
| `web/js/ui.js` | Panels / status / buttons |

**One-liner resume / 一句话续工**  
立方体 = 沿 **s** 堆的**切片面**；位置一律 **(s, x, y)**；面 **x,y∈[0,10]**；**1 s = 1 x = 1 y = UNIT**；右=+x 左=−x 上=+y 下=−y 前=+s 后=−s；公司=面上平面圆，直径=市值 log，颜色=环节渐变（电力深蓝→模型浅蓝）；焦点切片不动，其余沿 **−x** 左移淡出；环节标签可点击；**不画**轴/框/描边/脊柱/连线；**C** = 标准视角；左拖=旋转、右拖=平移。

---

*Last updated: 2026-10-07 · Coordinates are `(s, x, y)` in `web/js/coords.js`. Keep in sync with `LAYOUT.camera` and hotkeys in `scene.js`.*
