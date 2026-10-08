<p align="center">
  <img src="brand/logo.svg" alt="Open Company" width="96">
</p>

# Open Company spec

[中文](README.zh-CN.md)

Static specification site for [open-company.org](https://open-company.org). It specifies Open Company v0: the package layout, `Companyfile.yaml`, `Productfile.yaml`, task files, agent files, guards, and import.

Open `index.html`, or serve this directory at the site root so these paths resolve:

- `/schema/v0/companyfile.json`
- `/schema/v0/productfile.json`

`open-company/v0` is experimental. Those version URLs stay as they are. A later v1 would use a new path.

The schema files were generated with zod v4 `z.toJSONSchema` from the field constraints of `companyfileSchema` and `productfileSchema`. They do not depend on any other repository to be served. Task and agent front matter have no published schema in v0; the spec text is authoritative.

## Editing the specification

The text lives in [`spec/zh.md`](spec/zh.md) and [`spec/en.md`](spec/en.md). [`index.html`](index.html) is generated from them.

Section headings keep the same numbers in both files (`## 5. ...`, `### 5.1 ...`). `node build.mjs` refuses to write the page when those numbers diverge. A paragraph that is only bold is a term, and the next paragraph is its definition. A blockquote immediately before a code block is an example label; `Name · [Example file](path)` adds the link.

After editing, regenerate the page and commit it with the Markdown:

```bash
node build.mjs
```

Example package: `examples/acme/`. It loads cleanly with the reference reader (`loadOpenCompanyPackage`).

The mark is an open bracket with the company record in the opening. `brand/logo.svg` is the color symbol, `brand/logo-mono.svg` is one-color. Raster masters are `brand/logo-512.png`, `brand/logo-mono-512.png`, and `brand/icon-512.png`. Site icons are `favicon.svg`, `favicon-32.png`, and `apple-touch-icon.png`.
