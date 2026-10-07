# Open Company spec

Static spec site for [open-company.org](https://open-company.org). It documents Open Company package v0: the directory, `Companyfile.yaml`, and `Productfile.yaml`.

Open `index.html`, or serve this directory at the site root so these paths resolve:

- `/schema/v0/companyfile.json`
- `/schema/v0/productfile.json`

`open-company/v0` is experimental. Those version URLs stay as they are. A later v1 would use a new path.

The schema files were generated with zod v4 `z.toJSONSchema` from the field constraints of `companyfileSchema` and `productfileSchema`. They do not depend on any other repository to be served.

Example package: `examples/acme/`.
