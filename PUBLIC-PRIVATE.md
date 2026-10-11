# 公私隔离协议

文件名：`PUBLIC-PRIVATE.md`（英文路径，避免读写错误）。条款正文用中文。

补充条款。teamwork 后，**工程跟仓走，工作工具跟个人走**。Agent 是各人的工作方式，不是 FIDV 产品。随仓覆盖对方的 agent，会干扰各自的更新判断。每人按自身需要在本机设置 agent。

每次上传 GitHub **只交工程本身**。不交 agent 角色、调度任务、权力规则、Cursor 加载链。

本文件进仓，好让队员看见条款。

---

## 公（上传、队员可见）

| 路径 | 性质 |
|------|------|
| `ai-chain/`（含 `CONCEPTS.md`、网页、服务、启动器、图标） | 工程 |
| `class-3-coords/`（层级 JSON、ingest、README；生成的 `.db` 仍不跟踪） | 工程 |
| `DATA-SPACE/`（已跟踪的表与手册；`~$*`、实体 db 仍不跟踪） | 工程 |
| `Open-AI-Cube.command`、根 `README.md` | 工程 |
| `library/`：worklog、`showable-report/`、`bug-report/` | 队员读本与时间线，仍公开 |
| `agent_tasklist/DESIGN.md` | 产品三持，工程真源 |
| `agent_tasklist/AESTHETIC.md` | 色板 / chrome / splash，工程真源 |
| `agent_tasklist/INFORMATION.md` | 数据词条，工程真源 |
| `PUBLIC-PRIVATE.md` | 本协议，公开 |

## 私（停跟踪，本机保留）

| 路径 | 性质 |
|------|------|
| `agents/` | 角色说明书 |
| `agent_tasklist/` 除上表三份真源以外的文件（含 `RULE.md`、调度任务、三分部） | 任务与权力 |
| `.cursor/agents/`、`.cursor/skills/` | 本机 Cursor 工具 |

历史 commit 里曾经进过仓的 agent 文仍在旧版本里。不改写历史，不 force push。本机文件不删。

---

## 上传检查

1. 只 `git add` 工程路径与本协议、`.gitignore`、根 README。
2. 不要把 `agents/`、`.cursor/`、以及 `agent_tasklist/` 里非三份真源的改动加入提交。
3. 停跟踪用 `git rm --cached`，不要用不带 `--cached` 的 `git rm`。

## Pull

他机若仍跟踪上述私路径，`git pull` 会从**对方工作区删掉**那些文件。这符合「各自配置工具」。若还要留一份参考，先拷到仓外再 pull。
