# FIDV 数据真源（信息部）

信息部判断数据目录、调用词条、乱缺与补数公式时，只以本文及三分部文件为准。产品是否服务金融决策，以 `DESIGN.md` 为准（总监）。立方体概念与坐标语义以 `ai-chain/CONCEPTS.md` 为准（信息部不改 C-*）。

目标：让业主、父代理、总参谋部用**同一套词条**找到数据；乱缺先建议、不能改则上报；补数走彭博机 Excel 公式，不在本仓连终端。

---

## 1. 管辖

| 面 | 路径 / 说明 |
|----|-------------|
| 原始表 | `DATA-SPACE/`（含 `ICBC C/20261003/`、`ICBC C/20261005/`） |
| 层级库 | `class-3-coords/BICS-Classification/`（`bics-equity-hierarchy-2024.json`） |
| 成员库 | `bics_entities_20261003.db`（gitignore；`ingest_20261003_entities.py` 生成） |
| 词条 | 本文 §3 + `INFORMATION-manage.md` |
| 缺口 | `INFORMATION-clean.md` |
| 补数公式 | `INFORMATION-request.md`；产出落 `DATA-SPACE/` |

不独占：立方体 `ai-chain/data/companies.json` 演示链、C-CUBE 几何。不提交 `~$*.xlsx`。不要把 `BQLX.pdf` 当成 FIDV 拉数说明书。

---

## 2. 三分部

| 分部 | desk | 文件 | 技能 |
|------|------|------|------|
| 数据管理分部 | `manage` | `INFORMATION-manage.md` | 读数、管数、设定调用词条 |
| 数据清理部 | `clean` | `INFORMATION-clean.md` | 乱/缺改进建议；无力则上报业主 |
| 数据请求部 | `request` | `INFORMATION-request.md` | BQLX / Bloomberg Excel 专家；生成扒取公式表方案 |

派用：`information-department.md`。一次 `Task`，`subagent_type=information-department`。

---

## 3. 当前数据地图（管理分部维护）

| 调用词条（口语） | 指向 |
|------------------|------|
| 20261003 / 四级企业表 | `DATA-SPACE/ICBC C/20261003/BICS_LEGALENTITY/*.xlsx`（跳过旧 Staples L1、`pull-*`） |
| 20261005 / Staples 四级 | `DATA-SPACE/ICBC C/20261005/*.xlsx`（一叶一文件） |
| BQL 指导 / BQLX | `DATA-SPACE/ICBC C/20261003/BQLX.pdf`（117 页终端帮助，2026-10-03） |
| 公式样例 | `DATA-SPACE/ICBC C/20261003/BICS_LEGALENTITY/FOMULAR EXAMPLE.xlsx` |
| BICS 层级 / C-COORD-3 库 | `class-3-coords/BICS-Classification/bics-equity-hierarchy-2024.json` |
| 四级成员库 | `class-3-coords/BICS-Classification/bics_entities_20261003.db` |
| 摄入 | `python3 class-3-coords/BICS-Classification/ingest_20261003_entities.py` |
| 四级名单 API | `GET /api/bics/entities?bics=<L4 compact>` — 仅**主业 L4**；身份=完整 Member Ticker；含空占比胜出。可选 `listingCountry=` |
| 主业 | 同一 ticker 最大有数 `pct_tot_rev`（空不当 100）；并列：`ind_rev` → `bics_code_l4` → `source_file` → `id`。全空时仍由后四键定一条主业 L4，**进门厅/名单** |
| 空占比企业坐标 | 胜出行 `pct` 空：名单 `legal_entity_coord` = `-` + 无符号 7×2。有数胜出不加 `-`。层级节点坐标始终无符号 |
| 其他业务 | 非主业 L1 及其 `% Tot Rev`（同 L1 多行加总）；`pct_sum` 只加已披露段 |
| 门厅子节点 API | `GET /api/bics/children?parent=`；可选 `listingCountry=`（ISO 或 `UNMAPPED`）；返回 `companyCount` / `totalCount` / `listingCountries` |
| 原表家数 / `diff.xlsx` Real | 各 L1 彭博成员点数（业主表）；与库内该 L1 **去重 Member Ticker** 应接近。`diff.xlsx` Government Real=117982 **与源表不符**（源表 25000 行） |
| 工程家数 / `diff.xlsx` In product | 门厅该 L1 的 `companyCount`：主业 L4 码前缀落在该 L1（含空占比胜出；Government=`50`）。不是该 L1 xlsx 行数 |
| 上市地 | 黄键倒数第二段交易所码 → ISO（`listing.py`）；CN=加拿大、CH=中国沪、IT=以色列、SP=新加坡、SG=塞尔维亚、IE=伊朗 Farabourse。未映射进 Unmapped，不猜。**不是**总部国，**不是**立方体 `?country=` |
| 权威码 | `bicsCode`，长度 `2×level` |
| 产品坐标 | 层级节点 `legalEntityCoord` 无符号 7×2；企业空占比胜出时名单字段前加 `-` |
| Staples 旧 L1 表 | `BICS_Comsumer Staples.xlsx` — **仅 L1，不摄入** |
| Staples 四级成员 | `DATA-SPACE/ICBC C/20261005/` 14 个 xlsx，文件名=L4；无 Level2–4 列。摄入按文件名对 2024 库（`Agricultural & Producers` → `Agricultural Producers` / `12101010`）。含 `Other Wholesalers - Staples.xlsx`（`12111012`） |
| Staples 补拉 L2–L4 | `DATA-SPACE/ICBC C/20261003/BICS_LEGALENTITY/pull-staples-l2l4.xlsx`（公式样例；摄入跳过 `pull-*`） |
| 后三类试拉 / L5–L7 | `DATA-SPACE/ICBC C/20261003/BICS_LEGALENTITY/pull-comms-eq-l5l7.xlsx` — Technology → Communications Equipment（`19101010`，577 ticker）。一企一行 `_xll.BQL` 外壳同 FOMULAR EXAMPLE；**L5/L6/L7 mnemonic 须在彭博机 FLDS 填入 CONFIG!B12–B14**（BQLX.pdf 无这些字段名，不猜）。不用 `segments()`、不用 BCLASS。拷回前不改摄入、不改门厅四段显示。 |

禁止：清理建议写成「已经修了」；提交 Office 锁文件。

---

## 4. 与其它角色

| 角色 | 关系 |
|------|------|
| 总监 | 有 `ai-chain/` 代码改动时仍终审 DESIGN；信息部不写「通过/打回」 |
| 总参谋部 | 可调度信息部；业主「电」下可规划管理本角色文件；信息部仍只出方案不改仓 |
| 美工部 | 平行；各管美学 / 数据 |
| 书记 | 信息部不写 worklog |

*Last updated: 2026-10-04 · 总参谋部立信息部。*
