<!--
本文件是规范正文。修改后在仓库根目录运行 node build.mjs，并一并提交生成的 index.html。
章节标题必须带章节号：二级写成「## 1. 标题」，三级写成「### 5.1 标题」。中英文的章节号序列必须相同。
单独成段、整段只有加粗的一行（例如 **公司包** 或 **`spec`**）是术语，紧接着的下一段是它的定义。
代码块紧前面的引用行是示例标题。写成「名称 · [示例文件](路径)」时，标题旁会放上这个链接。
-->

---
title: "Open Company 规范"
description: "Open Company 规范 v0：把一家公司写成一个目录。目录布局、Companyfile.yaml、Productfile.yaml、任务与 Agent 文件，以及导入。"
toc: "目录"
spec: open-company/v0
versionLabel: "版本"
version: "`open-company/v0`，实验版本"
revisedLabel: "修订"
revised: "2026-10-10"
schemaLabel: "Schema"
---

# Open Company 规范

**状态。**v0 是实验版本。已发布字段的含义和 Schema 地址保持不变。实验期内可以增加可选字段，并记在文首的修订日期里。不兼容的修改将作为 v1 发布，使用新的 `spec` 值和新的 Schema 地址。

本文中，「必须」表示没有例外，「不得」表示禁止，「应当」表示除非有充分理由否则要这样做，「可以」表示允许但不要求。

## 1. 摘要

Open Company 把一家公司写成一个目录。目录里有公司和产品的声明、给 Agent 的工作说明、按日程运行的任务，以及负责具体工作的 Agent。实现了本规范的运行时读取这个目录，替这家公司做研发和运营。

本规范规定这个目录的布局、其中每类文件的写法，以及运行时导入它时必须做什么。

## 2. 范围

本规范规定：

- 公司包的目录布局；
- `Companyfile.yaml` 与 `Productfile.yaml`；
- 任务文件、Agent 文件和检查脚本；
- 运行时导入公司包时必须遵守的步骤。

本规范不规定：

- 一家公司如何运营、如何发布产品；
- 使用哪一个运行时，以及运行时内部如何保存数据；
- 运行时如何生成公司包；
- 注册中心、账号或包托管。

## 3. 术语

**公司包**

按第 5 节布局组织、根目录有 `Companyfile.yaml` 的目录。包内不含 `.git`。

**运行时**

读取公司包、并按其中的声明执行工作的软件。

**写出方**

生成公司包的人或软件。

**导入方**

把公司包导入自己运行时的人。

**声明文件**

`Companyfile.yaml` 和 `Productfile.yaml`，均为 YAML。

**任务**

一项反复执行的运营工作，例如每天整理用户反馈。一个任务一个 Markdown 文件。

**班次**

任务的一次执行。

**Agent**

负责某一类工作的执行者，例如文案。一个 Agent 一个 Markdown 文件。

**Skill**

一段可复用的做法，Agent 在工作中按需调用。

**检查脚本**

任务开始前运行的小脚本，决定这一次是否值得开始。

## 4. 原则

1. **一家公司是一个目录。**做事的方法写成文件。一个人加一个产品，就可以是一家公司。v0 里，这个目录是一个 Git 仓库或一个本机文件夹。
2. **运行时执行，人来决定。**导入前先给人看将要写入的内容，人确认之后才写入。任务的日程在导入后保持关闭，由人决定何时打开。
3. **复制之后，这家公司属于导入方。**包里带走的是做法。密钥的值、运行记录、只在某台机器上有效的路径，都不进包。导入之后，与来源不再同步。

## 5. 目录布局与通用规则

```
my-company/
  Companyfile.yaml           公司声明（必须）
  AGENTS.md                  公司级工作说明
  LICENSE
  agents/{id}.md             Agent
  skills/{id}/SKILL.md       Skill
  products/{id}/
    Productfile.yaml         产品声明（必须）
    AGENTS.md                产品级工作说明
    goal.md                  产品当前目标
    code/                    源码快照，仅 source.path 形式
    projects/{id}/           运营项目
      README.md              项目说明
      tasks/{id}.md          任务
      guards/*.mjs           检查脚本
      .opencode/             项目自带的 Agent、Skill 与配置
```

除标注「必须」的两类文件外，其余都可以没有。产品、项目、任务、Agent 和 Skill 都按路径发现，声明文件里不再列一遍。

- `AGENTS.md` 是给 Agent 读的工作说明，沿用 [AGENTS.md](https://agents.md) 约定。公司级的对所有工作生效，产品级的只对该产品生效。
- `goal.md` 用一段正文写这个产品当前要达成的目标。
- `LICENSE` 由写出方选择。运行时不读取它。
- `code/` 只与 `source.path` 一起出现，是不含 `.git` 的源码快照。
- `.opencode/` 按 [OpenCode](https://opencode.ai) 的目录约定原样保留。本规范不解析其中的内容。
- 项目目录中，`README.md`、`tasks/`、`guards/`、`.opencode/` 以外的文件不属于公司包，导入时不复制。
- 公司根目录下的 `projects/` 为以后的公司级项目保留。v0 运行时遇到它时应当给出警告并跳过，不得报错。

### 5.1 标识与引用

产品、项目、任务、分组、Agent 和 Skill 都有 `id`：小写字母开头，其后最多 47 个小写字母、数字或短横线，即 `^[a-z][a-z0-9-]{0,47}$`。`id` 等于对应的文件名或目录名（不含扩展名）。产品和 Agent 的 `id` 在公司内唯一，项目和分组的 `id` 在产品内唯一，任务的 `id` 在项目内唯一。

引用另一个对象时写它的 `id`。需要跨产品引用的字段写 `{product}/{id}`。每个字段允许哪种写法，在字段定义里说明。

### 5.2 文本

字符串的长度按去掉首尾空白之后计算，单位是 UTF-16 码元。标为「非空」的字符串，去掉首尾空白后至少有一个字符。

### 5.3 省略

写出方应当省略空列表、空对象，以及取默认值的键。读取方必须把省略的键按默认值处理。`requires.secrets` 和 `requires.logins` 一旦写出就不得为空。

### 5.4 未知键与扩展

声明文件和 frontmatter 中，本版本未定义的键会使文件无效，以 `x-` 开头的扩展键除外。扩展键匹配 `^x-[A-Za-z0-9][A-Za-z0-9-]*$`，建议带上厂商名，例如 `x-acme`。任何对象都可以带扩展键。读取方必须接受扩展键，不认识时忽略即可。v0 运行时不保存扩展键，因此重新写出的包里不会再有它们。

### 5.5 密钥

包内任何文件都不得包含密钥的值、访问令牌，或只在某台机器上有效的绝对路径。需要密钥时，只在 `requires.secrets` 里写它的名称。

## 6. Companyfile.yaml

公司声明，位于包的根目录。最小的合法文件只有 `spec` 和 `name`。

**`spec`**

必填。值为 `open-company/v0`。

**`id`**

可选，写出方应当填写。UUID，标识写出这个包的公司，改名时不变。导入方不会把它当作自己的 id，只用它在再次导入时认出同一个包（见第 11 节）。

**`name`**

必填。显示名称，1–200 个字符，任何文字和空格都可以。只用于显示，不作查找键。

**`description`**

可选。一句话介绍。非空。

**`homepage`**

可选。主页 URL。

> Companyfile.yaml · [示例文件](examples/acme/Companyfile.yaml)

```yaml
spec: open-company/v0
id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
name: Acme Labs
description: Tools for small teams.
homepage: https://acme.example
```

## 7. Productfile.yaml

产品声明，位于 `products/{id}/Productfile.yaml`。

**`spec`**

必填。值为 `open-company/v0`。

**`id`**

必填。产品 id，必须等于所在目录名。

**`title`**

必填。显示标题。非空。

**`lifecycle`**

必填。产品所处阶段，取下表四个值之一。导入方可以在导入时修改。

**`source`**

必填。产品源码在哪里。有 `git` 和 `path` 两种形式，由对象里出现的是哪个键决定，二者不得同时出现。`source` 不得指向本机路径。

**`source.git`**

`git` 形式必填。源码仓库的 URL。`commit` 必须能从这个地址取到。

**`source.path`**

`path` 形式必填。值固定为 `./code`，指同目录下的源码快照。

**`source.commit`**

两种形式都必填。7–64 位十六进制提交号，大小写均可。`git` 形式下是导入时要检出的提交；`path` 形式下只记录快照取自哪一次提交。

**`source.branch`**

两种形式都必填。非空的分支名。导入后在这个分支上继续开发。

**`requires`**

可选。导入方需要自己准备的东西。`secrets` 和 `logins` 只写名称。

**`requires.secrets`**

可选。需要的密钥名称列表，每项非空。只写名称，不写值。

**`requires.logins`**

可选。需要有人先在本机登录的平台名称列表，每项非空。名称是给人看的提示，本规范不定义名称表。

**`requires.browser`**

可选。布尔值。省略与 `false` 相同，写出方应当省略 `false`。为 `true` 时，这个产品需要一份独立的登录浏览器，由导入方在本机准备。包里不写路径、cookie 或配置档。

**`groups`**

可选。项目分组，列表顺序即显示顺序。每项有 `id` 和非空的 `title`。

**`projects`**

可选。运营项目。每项有 `id`、非空的 `title`，以及可选的 `group`。`group` 必须是本文件 `groups` 里的某个 `id`。项目的 `id` 等于 `projects/` 下的目录名。

| `lifecycle` | 含义 |
| --- | --- |
| `explore` | 还在验证方向。 |
| `live` | 正式运营。 |
| `maintain` | 只做维护，不再扩展。 |
| `frozen` | 已冻结。运行时不得再按日程为它开始班次。 |

> Productfile.yaml · source.git · [示例文件](examples/acme/products/acme-notes/Productfile.yaml)

```yaml
spec: open-company/v0
id: acme-notes
title: Acme Notes
lifecycle: live
source:
  git: https://github.com/acme/acme-notes
  commit: 3f2c1a9
  branch: main
requires:
  secrets: [app-store-key]
  logins: [slack]
groups:
  - id: acquire
    title: Acquisition
projects:
  - id: feedback
    title: User feedback
    group: acquire
```

> Productfile.yaml · source.path

```yaml
spec: open-company/v0
id: acme-notes
title: Acme Notes
lifecycle: live
source:
  path: ./code
  commit: 3f2c1a9
  branch: main
```

## 8. 任务文件

位于 `products/{product}/projects/{project}/tasks/{id}.md`。文件以 YAML frontmatter 开头，其后的正文是这条任务的说明，执行班次的 Agent 按它工作。

**`title`**

必填。显示标题。非空。

**`trigger`**

可选。什么时候开始一个班次，取 `schedule`、`after`、`webhook` 三种形式之一。省略表示只能由人手动开始。

**`trigger.schedule`**

五段式 cron 表达式。相邻两次触发的最短间隔不超过 60 分钟时，必须同时写 `trigger.guard`。

**`trigger.after`**

上游任务，写成 `{project}/{task}`，必须在同一产品内，只能写一个。上游的一个班次成功结束、且当天不再续跑之后，开始本任务的班次。上游失败或取消时不触发。沿 `after` 往上追溯不得回到自己，链长不得超过 8。

**`trigger.webhook`**

值为空对象 `{}`。每收到一次外部请求开始一个班次。请求地址和令牌由导入方的运行时生成，不写在包里。

**`trigger.guard`**

可选，只能与 `schedule` 或 `after` 一起写。检查脚本的路径，相对于项目目录，必须是 `guards/` 下的 `.mjs` 文件（见第 10 节）。

**`period`**

这个班次负责的时间范围：`day`（当天）、`week`（上一周）或 `month`（当月）。它决定这一班汇总哪一段的记录，与运行频率无关。省略 `trigger`，或使用 `schedule`、`after` 时必填；使用 `webhook` 时不得填写。

**`followUp.maxPerDay`**

可选。一个班次没做完时，当天最多自动续跑几次，1–20。只能用于 `period: day`。省略表示不续跑。

**`team`**

可选。这个班次可以把工作分给哪些 Agent，写 Agent 的 `id`：可以是 `agents/` 下的，也可以是本项目 `.opencode/` 里的。

**`reads.projects`**

可选。这个班次可以只读查看的其他项目。同产品写项目 `id`，跨产品写 `{product}/{id}`。任务所在的项目本来就可以读写，不用写。

**`reads.code`**

可选。这个班次可以只读查看哪些产品的源码，写产品 `id`。

任务文件没有「是否启用」的字段。导入之后，所有日程都处于关闭状态，由人打开（见第 11 节）。

> tasks/daily-review.md · [示例文件](examples/acme/products/acme-notes/projects/feedback/tasks/daily-review.md)

```yaml
---
title: Daily review triage
trigger:
  schedule: "*/30 * * * *"
  guard: guards/new-reviews.mjs
period: day
followUp:
  maxPerDay: 2
team: [copywriter]
reads:
  code: [acme-notes]
---

Read new app store reviews, group them by issue,
and draft a reply for each one that needs it.
```

> trigger.after

```yaml
trigger:
  after: feedback/daily-review
period: week
```

## 9. Agent 文件与 Skill

Agent 位于 `agents/{id}.md`。文件以 YAML frontmatter 开头，其后的正文是这个 Agent 的工作说明。

**`title`**

必填。显示名称。非空。

**`description`**

必填。一句话说明它负责什么。非空。

**`skills`**

可选。它可以使用的 Skill：`skills/` 下的 `id`，或运行时内置的 Skill 名称。每项 1–64 个字符。

**`mcp`**

可选。它可以使用的远程 MCP 服务名称，每项 1–64 个字符。连接地址和凭据不进包，由导入方配置。

**`browser`**

可选。为 `true` 时表示它的工作需要浏览器。运行时不提供浏览器时，必须在导入预览中提示。

> agents/copywriter.md · [示例文件](examples/acme/agents/copywriter.md)

```yaml
---
title: Copywriter
description: Drafts review replies and release notes.
skills: [reply-style]
---

Write short, plain replies. Thank the user once,
answer the actual question, and never promise dates.
```

Skill 位于 `skills/{id}/SKILL.md`，同一目录下可以带它需要的其他文件。`SKILL.md` 沿用 [Agent Skills](https://agentskills.io) 的格式，本规范不另行规定。

## 10. 检查脚本

检查脚本位于 `products/{product}/projects/{project}/guards/`，是一个 JavaScript 模块（`.mjs`）。日程到点或上游完成后，运行时先运行它，再决定是否开始班次。这样，频繁的日程只在真的有事时才动用 Agent。

- 运行时以项目目录为工作目录、用 Node.js 运行它，并设置超时。
- 退出码 `0`：开始班次。运行时应当把标准输出交给这个班次，说明这次为什么开始。
- 退出码 `1`：这次跳过，不开始班次。
- 其他退出码、超时或抛出异常：检查出错，不开始班次。
- 检查脚本只读，不得修改任何文件，也不得依赖密钥的值。它需要的进度记录由任务的班次写在项目目录里。

> guards/new-reviews.mjs

```js
import { existsSync, readFileSync } from "node:fs";

const file = "inbox/reviews.json";
const reviews = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
if (reviews.length === 0) process.exit(1);
console.log(`${reviews.length} new reviews`);
```

检查脚本是公司包里唯一会被执行的代码。导入它等于允许它在导入方的机器上运行，所以导入时必须先给人看（见第 11 节）。

## 11. 导入

导入的输入是一个本机目录，或一个 GitHub 仓库 URL（可以指定 ref）。v0 没有注册中心。实现了本规范的运行时导入时必须依次做到：

1. **校验。**包的根目录必须有 `Companyfile.yaml`。按本规范逐个校验文件，包括 Schema 检查不到的规则：`id` 等于文件名或目录名，`group` 指向存在的分组，`after` 不成环、链长不超过 8，短间隔日程写了检查脚本。任一文件不合格，必须拒绝导入，并指出是哪个文件、哪一条。
2. **预览。**写入任何内容之前，列出将要加入的产品、项目、任务、Agent 和 Skill；仍须由人提供的东西，即代码放在哪里、密钥名称、登录平台，以及哪些产品需要独立的登录浏览器；以及包里所有可执行的内容和需要的外部能力，即检查脚本的全文、MCP 名称，和哪些 Agent 需要浏览器。同名对象已经存在时，由人选择改名或跳过。
3. **确认后写入。**人确认之后才写入。写入中途失败时，必须撤回已经写入的部分。
4. **不自动开始。**导入完成后，所有日程都处于关闭状态。导入本身不运行检查脚本，也不开始任何班次。
5. **不跟踪来源。**导入完成后，这家公司属于导入方。运行时不记录来源地址，不提示来源有新版本，也不把本地改动送回来源。
6. **再次导入。**运行时可以用 `Companyfile.yaml` 的 `id` 认出这是之前导入过的同一个包。这时它把差异逐项列出，由人勾选要更新的项。没有勾选的项保持本机现状，本机独有的项不得删除。

### 11.1 `source.git`

从 `source.git` 取得源码，检出 `commit`，然后在 `branch` 上继续。导入方可以把地址换成自己的仓库，例如一个 fork。v0 不会替导入方创建这个仓库。

### 11.2 `source.path`

把 `products/{id}/code/` 复制到导入方选择的位置，在那里新建仓库，起始分支为 `branch`。`commit` 只用来说明快照的出处。

## 12. Schema

两份声明文件各有一份 JSON Schema（draft 2020-12），用来校验 YAML 解析之后的对象。这两个地址属于 v0，保持不变。已发布字段的含义不变。实验期内增加的可选字段记在文首的修订日期里。

- [`/schema/v0/companyfile.json`](schema/v0/companyfile.json)
- [`/schema/v0/productfile.json`](schema/v0/productfile.json)

Schema 只检查单个文件的形状，有三点检查不到：长度不先去掉首尾空白再计算；不检查 `id` 是否等于目录名；不检查跨字段、跨文件的引用。这些由运行时在导入时检查（见第 11 节第 1 步）。任务文件和 Agent 文件在 v0 没有单独的 Schema，以第 8、9 节为准。

## 13. 相关站点

[opencompany.run](https://opencompany.run) 收录符合本规范的公司包，供人导入。尚未上线。

[Munk AI](https://munk.sh) 是一个实现了本规范的运行时。
