<!--
This file is the specification text. After editing, run `node build.mjs` from the repository root and commit the generated index.html with your change.
Headings must keep their section numbers: "## 1. Title" for sections and "### 5.1 Title" for subsections. The Chinese and English files must use the same sequence of numbers.
A paragraph that is only bold (for example **Company package** or **`spec`**) is a term. The next paragraph is its definition.
A blockquote immediately before a code block is the example label. Write "Name · [Example file](path)" to put a link beside it.
-->

---
title: "Open Company Specification"
description: "Open Company Specification v0: a company written as a directory. Layout, Companyfile.yaml, Productfile.yaml, task and agent files, and import."
toc: "Contents"
spec: open-company/v0
versionLabel: "Version"
version: "`open-company/v0`, experimental"
revisedLabel: "Revised"
revised: "2026-10-10"
schemaLabel: "Schema"
---

# Open Company Specification

**Status.** v0 is experimental. The meaning of a published field and the schema URLs stay the same. Optional fields may be added while v0 is experimental, and are recorded in the revised date at the top. Incompatible changes will ship as v1, with a new `spec` value and new schema URLs.

In this document, “must” means without exception, “must not” means forbidden, “should” means required unless there is a good reason not to, and “may” means allowed but not required.

## 1. Summary

Open Company describes a company as a directory. The directory holds declarations for the company and its products, instructions for agents, tasks that run on a schedule, and the agents that do the work. A runtime that implements this specification reads the directory and runs engineering and operations for the company.

This specification defines the layout of that directory, how each kind of file in it is written, and what a runtime must do when it imports one.

## 2. Scope

This specification defines:

- the layout of a company package;
- `Companyfile.yaml` and `Productfile.yaml`;
- task files, agent files, and guards;
- the steps a runtime must follow when importing a company package.

This specification does not define:

- how a company operates or ships its products;
- which runtime to use, or how a runtime stores its data;
- how a runtime produces a company package;
- a registry, accounts, or package hosting.

## 3. Terms

**Company package**

A directory laid out as in section 5, with `Companyfile.yaml` at its root. It contains no `.git`.

**Runtime**

Software that reads a company package and does the work it declares.

**Writer**

The person or software that produces a company package.

**Importer**

The person who imports a company package into their own runtime.

**Declaration file**

`Companyfile.yaml` or `Productfile.yaml`. Both are YAML.

**Task**

A recurring piece of operations work, such as sorting user feedback every day. One Markdown file per task.

**Shift**

One run of a task.

**Agent**

A worker responsible for one kind of work, such as copywriting. One Markdown file per agent.

**Skill**

A reusable procedure that an agent calls on while working.

**Guard**

A small script that runs before a task starts and decides whether this run is worth starting.

## 4. Principles

1. **A company is a directory.** How it works is written down as files. One person and one product can be a company. In v0, the directory is a Git repository or a local folder.
2. **The runtime does the work; a person decides.** Before import, a person sees what will be written, and nothing is written until they confirm. Task schedules stay off after import until a person turns them on.
3. **Once copied, the company belongs to the importer.** A package carries the way of working. Secret values, run history, and paths that only exist on one machine stay out of it. After import, nothing stays in sync with the source.

## 5. Layout and general rules

```
my-company/
  Companyfile.yaml           company declaration (required)
  AGENTS.md                  company-wide instructions
  LICENSE
  agents/{id}.md             agents
  skills/{id}/SKILL.md       skills
  products/{id}/
    Productfile.yaml         product declaration (required)
    AGENTS.md                product instructions
    goal.md                  current product goal
    code/                    source snapshot, source.path only
    projects/{id}/           operations projects
      README.md              project description
      tasks/{id}.md          tasks
      guards/*.mjs           guards
      .opencode/             project-local agents, skills, and config
```

Apart from the two files marked required, everything is optional. Products, projects, tasks, agents, and skills are found by path; declaration files do not list them again.

- `AGENTS.md` holds instructions for agents and follows the [AGENTS.md](https://agents.md) convention. The company-level file applies to all work; a product-level file applies only to that product.
- `goal.md` states, in prose, what the product is currently trying to achieve.
- `LICENSE` is chosen by the writer. Runtimes do not read it.
- `code/` appears only with `source.path`. It is a source snapshot without `.git`.
- `.opencode/` is kept as is, following the [OpenCode](https://opencode.ai) directory convention. This specification does not interpret its contents.
- In a project directory, files other than `README.md`, `tasks/`, `guards/`, and `.opencode/` are not part of the package and are not copied on import.
- `projects/` at the company root is reserved for future company-level projects. A v0 runtime should warn and skip it, and must not fail because of it.

### 5.1 Identifiers and references

Products, projects, tasks, groups, agents, and skills each have an `id`: a lowercase letter followed by at most 47 lowercase letters, digits, or hyphens, that is `^[a-z][a-z0-9-]{0,47}$`. An `id` equals the corresponding file or directory name, without extension. Product and agent ids are unique within the company, project and group ids within a product, and task ids within a project.

To refer to another object, write its `id`. Fields that allow references across products use `{product}/{id}`. Each field definition states which forms it accepts.

### 5.2 Text

String length is measured after trimming leading and trailing whitespace, in UTF-16 code units. A string marked “non-empty” has at least one character after trimming.

### 5.3 Omission

Writers should omit empty lists, empty objects, and keys that hold their default value. Readers must treat an omitted key as its default. `requires.secrets` and `requires.logins`, when present, must not be empty.

### 5.4 Unknown keys and extensions

In declaration files and front matter, a key this version does not define makes the file invalid, unless it is an extension key starting with `x-`. Extension keys match `^x-[A-Za-z0-9][A-Za-z0-9-]*$` and should include a vendor name, such as `x-acme`. Any object may carry extension keys. Readers must accept them and may ignore those they do not recognize. v0 runtimes do not store extension keys, so a package written again will not contain them.

### 5.5 Secrets

No file in a package may contain a secret value, an access token, or an absolute path that only exists on one machine. When a secret is needed, list only its name in `requires.secrets`.

## 6. Companyfile.yaml

The company declaration, at the package root. The smallest valid file has only `spec` and `name`.

**`spec`**

Required. The value is `open-company/v0`.

**`id`**

Optional; writers should include it. A UUID that identifies the company that wrote the package. It does not change when the company is renamed. The importer does not adopt it as its own id; it only uses it to recognize the same package on a later import (see section 11).

**`name`**

Required. Display name, 1–200 characters, in any script, spaces allowed. Used for display only, not as a lookup key.

**`description`**

Optional. A one-sentence introduction. Non-empty.

**`homepage`**

Optional. Homepage URL.

> Companyfile.yaml · [Example file](examples/acme/Companyfile.yaml)

```yaml
spec: open-company/v0
id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
name: Acme Labs
description: Tools for small teams.
homepage: https://acme.example
```

## 7. Productfile.yaml

The product declaration, at `products/{id}/Productfile.yaml`.

**`spec`**

Required. The value is `open-company/v0`.

**`id`**

Required. The product id. Must equal the name of the directory it is in.

**`title`**

Required. Display title. Non-empty.

**`lifecycle`**

Required. The product's stage, one of the four values in the table below. The importer may change it on import.

**`source`**

Required. Where the product's source code is. There are two forms, `git` and `path`; the form is determined by which of the two keys is present, and they must not appear together. `source` must not point at a local path.

**`source.git`**

Required in the `git` form. URL of the source repository. `commit` must be reachable from it.

**`source.path`**

Required in the `path` form. Always `./code`, the source snapshot next to this file.

**`source.commit`**

Required in both forms. A 7–64 digit hexadecimal commit hash, in either case. In the `git` form it is the commit to check out on import; in the `path` form it only records which commit the snapshot was taken from.

**`source.branch`**

Required in both forms. A non-empty branch name. Development continues on this branch after import.

**`requires`**

Optional. Things the importer must provide. `secrets` and `logins` are names only.

**`requires.secrets`**

Optional. Names of the secrets needed, each non-empty. Names only, never values.

**`requires.logins`**

Optional. Names of platforms someone must first sign in to on the local machine, each non-empty. The names are hints for people; this specification does not define a list of them.

**`requires.browser`**

Optional. A boolean. Omission and `false` are the same, and writers should omit `false`. When `true`, this product needs its own login browser, which the importer prepares on their machine. The package does not include paths, cookies, or profile files.

**`groups`**

Optional. Project groups, displayed in list order. Each item has an `id` and a non-empty `title`.

**`projects`**

Optional. Operations projects. Each item has an `id`, a non-empty `title`, and an optional `group`, which must be the `id` of an entry in `groups` in this file. A project `id` equals its directory name under `projects/`.

| `lifecycle` | Meaning |
| --- | --- |
| `explore` | Still testing the direction. |
| `live` | In active operation. |
| `maintain` | Maintenance only, no new scope. |
| `frozen` | Frozen. A runtime must not start scheduled shifts for it. |

> Productfile.yaml · source.git · [Example file](examples/acme/products/acme-notes/Productfile.yaml)

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

## 8. Task files

Located at `products/{product}/projects/{project}/tasks/{id}.md`. The file starts with YAML front matter. The body that follows is the task's instructions; the agent running a shift works from it.

**`title`**

Required. Display title. Non-empty.

**`trigger`**

Optional. When a shift starts: one of three forms, `schedule`, `after`, or `webhook`. When omitted, shifts start only when a person starts one by hand.

**`trigger.schedule`**

A five-field cron expression. If the shortest interval between two consecutive runs is 60 minutes or less, `trigger.guard` is required.

**`trigger.after`**

The upstream task, written `{project}/{task}`. It must be in the same product, and there can be only one. A shift of this task starts after a shift of the upstream task succeeds and will not be followed up that day. Upstream failure or cancellation does not trigger it. Following `after` upstream must never lead back to the same task, and the chain must not be longer than 8.

**`trigger.webhook`**

An empty object, `{}`. Each incoming request starts a shift. The request URL and token are generated by the importer's runtime and are not part of the package.

**`trigger.guard`**

Optional, and allowed only with `schedule` or `after`. Path to a guard, relative to the project directory. It must be a `.mjs` file under `guards/` (see section 10).

**`period`**

The time range a shift is responsible for: `day` (today), `week` (the previous week), or `month` (this month). It decides which span of records the shift summarizes, independent of how often it runs. Required when `trigger` is omitted or uses `schedule` or `after`. Must not be set with `webhook`.

**`followUp.maxPerDay`**

Optional. How many times per day a shift that did not finish may be continued automatically, 1–20. Only with `period: day`. When omitted, there are no follow-ups.

**`team`**

Optional. Agents the shift may hand work to, by agent `id`, either from `agents/` or from this project's `.opencode/`.

**`reads.projects`**

Optional. Other projects the shift may read but not change. Use a project `id` within the same product, or `{product}/{id}` across products. The task's own project is always readable and writable and is not listed.

**`reads.code`**

Optional. Products whose source code the shift may read but not change, by product `id`.

Task files have no “enabled” field. After import, every schedule is off until a person turns it on (see section 11).

> tasks/daily-review.md · [Example file](examples/acme/products/acme-notes/projects/feedback/tasks/daily-review.md)

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

## 9. Agent files and skills

Agents are at `agents/{id}.md`. The file starts with YAML front matter. The body that follows is the agent's instructions.

**`title`**

Required. Display name. Non-empty.

**`description`**

Required. One sentence on what it is responsible for. Non-empty.

**`skills`**

Optional. Skills it may use: an `id` under `skills/`, or the name of a skill built into the runtime. Each 1–64 characters.

**`mcp`**

Optional. Names of remote MCP servers it may use, each 1–64 characters. Connection URLs and credentials are not part of the package; the importer configures them.

**`browser`**

Optional. `true` means its work needs a browser. A runtime that does not provide one must say so in the import preview.

> agents/copywriter.md · [Example file](examples/acme/agents/copywriter.md)

```yaml
---
title: Copywriter
description: Drafts review replies and release notes.
skills: [reply-style]
---

Write short, plain replies. Thank the user once,
answer the actual question, and never promise dates.
```

Skills are at `skills/{id}/SKILL.md`, and may bring other files they need in the same directory. `SKILL.md` follows the [Agent Skills](https://agentskills.io) format; this specification adds no rules of its own.

## 10. Guards

Guards live in `products/{product}/projects/{project}/guards/` and are JavaScript modules (`.mjs`). When a schedule fires or an upstream task finishes, the runtime runs the guard first and then decides whether to start a shift. This way a frequent schedule only puts an agent to work when there is something to do.

- The runtime runs it with Node.js, with the project directory as the working directory, under a timeout.
- Exit code `0`: start a shift. The runtime should pass standard output to the shift as the reason it started.
- Exit code `1`: skip this time; no shift starts.
- Any other exit code, a timeout, or an uncaught exception: the check failed; no shift starts.
- A guard is read-only: it must not change any file, and must not depend on secret values. Any progress it relies on is written into the project directory by the task's shifts.

> guards/new-reviews.mjs

```js
import { existsSync, readFileSync } from "node:fs";

const file = "inbox/reviews.json";
const reviews = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
if (reviews.length === 0) process.exit(1);
console.log(`${reviews.length} new reviews`);
```

Guards are the only code in a package that gets executed. Importing one means allowing it to run on the importer's machine, so it must be shown to a person at import (see section 11).

## 11. Import

The input to import is a local directory or a GitHub repository URL, optionally with a ref. v0 has no registry. A runtime that implements this specification must, in order:

1. **Validate.** The package root must contain `Companyfile.yaml`. Check every file against this specification, including the rules the schemas cannot check: each `id` equals its file or directory name, each `group` names an existing group, `after` chains have no cycles and are at most 8 long, and short-interval schedules have a guard. If any file fails, reject the import and say which file and which rule.
2. **Preview.** Before writing anything, list the products, projects, tasks, agents, and skills to be added; what a person still has to provide, namely where the code goes, the secret names, the login platforms, and which products need their own login browser; and everything executable or external the package needs, namely the full text of each guard, the MCP names, and which agents need a browser. When an object with the same name already exists, let the person choose to rename or skip it.
3. **Write only after confirmation.** Nothing is written until a person confirms. If writing fails partway, undo what was already written.
4. **Start nothing.** After import, every schedule is off. Import itself runs no guard and starts no shift.
5. **Do not track the source.** After import, the company belongs to the importer. The runtime records no source URL, does not announce newer versions of the source, and sends no local changes back.
6. **Import again.** A runtime may use the `id` in `Companyfile.yaml` to recognize a package it has imported before. It then lists the differences one by one, and the person checks the ones to update. Unchecked items keep their local state, and items that exist only locally must not be deleted.

### 11.1 `source.git`

Fetch the source from `source.git`, check out `commit`, and continue on `branch`. The importer may replace the URL with a repository of their own, such as a fork. v0 does not create that repository for the importer.

### 11.2 `source.path`

Copy `products/{id}/code/` to a location the importer chooses and create a new repository there, starting on `branch`. `commit` only records where the snapshot came from.

## 12. Schema

Each declaration file has a JSON Schema (draft 2020-12) that validates the object after YAML parsing. These two URLs belong to v0 and stay the same. The meaning of a published field does not change. Optional fields added while v0 is experimental are recorded in the revised date at the top.

- [`/schema/v0/companyfile.json`](schema/v0/companyfile.json)
- [`/schema/v0/productfile.json`](schema/v0/productfile.json)

The schemas check the shape of one file at a time and cannot check three things: they measure length without trimming first; they do not check that an `id` equals its directory name; and they do not check references across fields or files. A runtime checks these at import (section 11, step 1). Task files and agent files have no separate schema in v0; sections 8 and 9 are authoritative.

## 13. Related sites

[opencompany.run](https://opencompany.run) collects company packages that conform to this specification, for others to import. Not yet live.

[Munk AI](https://munk.sh) is a runtime that implements this specification.
