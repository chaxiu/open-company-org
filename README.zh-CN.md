# Open Company 规范

[English](README.md)

[open-company.org](https://open-company.org) 的静态规范站。它规定 Open Company v0：包目录布局、`Companyfile.yaml`、`Productfile.yaml`、任务文件、Agent 文件、守卫，以及导入。

直接打开 `index.html`，或把本目录作为站点根提供服务，使下面这些路径可以访问：

- `/schema/v0/companyfile.json`
- `/schema/v0/productfile.json`

`open-company/v0` 仍是实验版本。这些版本 URL 保持不变。以后的 v1 会使用新路径。

Schema 文件由 zod v4 的 `z.toJSONSchema` 从 `companyfileSchema` 和 `productfileSchema` 的字段约束生成。提供这些文件不依赖任何其他仓库。v0 没有为任务和 Agent 的 front matter 发布 schema；规范正文是权威来源。

## 修改规范

正文在 [`spec/zh.md`](spec/zh.md) 和 [`spec/en.md`](spec/en.md)。[`index.html`](index.html) 由它们生成。

两边的章节标题使用同一套编号（`## 5. ...`、`### 5.1 ...`）。编号不一致时，`node build.mjs` 不会写出页面。只含加粗的段落是术语，下一段是它的定义。代码块正前方的引用块是示例标签；写成 `名称 · [示例文件](path)` 会带上链接。

改完后重新生成页面，并和 Markdown 一起提交：

```bash
node build.mjs
```

示例包在 `examples/acme/`。参考读取器（`loadOpenCompanyPackage`）可以干净地加载它。

标志是一个开口括号，开口里是公司记录。`brand/logo.svg` 是彩色符号，`brand/logo-mono.svg` 是单色。位图母版是 `brand/logo-512.png`、`brand/logo-mono-512.png` 和 `brand/icon-512.png`。站点图标是 `favicon.svg`、`favicon-32.png` 和 `apple-touch-icon.png`。
