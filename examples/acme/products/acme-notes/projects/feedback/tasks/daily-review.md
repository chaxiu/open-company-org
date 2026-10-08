---
title: Daily review triage
trigger:
  schedule: "*/30 * * * *"
  guard: guards/new-reviews.mjs
period: day
followUp:
  maxPerDay: 2
team:
  - copywriter
reads:
  code:
    - acme-notes
---

Read new app store reviews, group them by issue,
and draft a reply for each one that needs it.
