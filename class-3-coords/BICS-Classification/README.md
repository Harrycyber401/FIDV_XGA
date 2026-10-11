# BICS Classification — 3类坐标 / 行业坐标（C-COORD-3）

Bloomberg **BICS Equity Hierarchy 2024** 层级库。这是 FIDV 的第三类坐标：**行业坐标**（产品字段仍名 `legalEntityCoord`）。不参与立方体摆放。

## 真源

| 项 | 值 |
|----|-----|
| 文件 | `2144414.xlsx`（口语 214414） |
| 工作表 | `BICS Equity Hierarchy 2024`（第 3 表） |
| 级数 | 1–7；每级 +2 位数字；码长 2–14 |
| 叶深度 | 可为 4 / 5 / 6 / 7（浅叶右侧补 `00`） |

重建：

```bash
python3 build_bics_hierarchy.py
```

产物：

- `bics-equity-hierarchy-2024.json` — 权威结构化真源
- `bics_hierarchy.db` — SQLite 镜像（表 `bics_nodes`）

勿提交 Office 锁文件 `~$*.xlsx`。

## 码制

- **权威**：`bicsCode` 紧凑数字串（与 Bloomberg 表一致），长度 = `2 × level`
- **产品字段** `legalEntityCoord`：固定 **7 段 × 2 位**，连字符，例 `10-10-10-10-10-12-10`；叶不足 7 级时**右侧 `00` 填充**（真实深度见 `level` / `isLeaf`，勿把填充当成真实 L7）。工程首页与四级名单 **chrome 只显示前 4 段**。
- 旧草稿末段 4 位 `…-0000` **已废止**

可挂非叶码（粗分类）；一企一码（一期约定）。企业逐户填码属二期，本期库内 `legalEntityCoord` 仅出现在层级节点上。

工程首页（`/`）同版面钻 **L1–L3**：`GET /api/bics/children?parent=`；**L4 格进 `/list?bics=`** 公司名单（20261003 L1 成员 + 20261005 Staples 四级成员）。

企业成员库（gitignore，由 xlsx 生成）：

```bash
python3 ingest_20261003_entities.py
```

产物：`bics_entities_20261003.db`。20261003 按表内 Level4 对码；20261005 按文件名对 Staples 14 个 L4（`Agricultural & Producers` → `Agricultural Producers`）。跳过旧 L1-only `BICS_Comsumer Staples.xlsx`、`pull-*`、Office 锁、公式样例。**不**因文件名含 staples 跳过 `Other Wholesalers - Staples.xlsx`。勿提交 `~$*.xlsx`。盘点、调用词条、乱缺上报、补数公式走**信息部**（`agent_tasklist/INFORMATION.md`）。名单按完整 Member Ticker 取主业 L4（最大 `% Tot Rev`；空不当 100，空胜出仍进名单，企业坐标加 `-`）。

## 与立方体

见 `ai-chain/CONCEPTS.md` **C-COORD-3**。1类 `(s,x,y)`、2类 `ringCos`/`ringSin` 管位置；本库管行业归属。
