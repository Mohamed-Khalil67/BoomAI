# Angular skills

Angular building blocks: the official Angular team skills plus components, signals, async state, RxJS and template patterns.

| Skill | Use it for |
|---|---|
| [`angular-developer`](angular-developer/SKILL.md) | Generates Angular code and provides architectural guidance. (from the Angular team, see `vendor.json`) |
| [`angular-new-app`](angular-new-app/SKILL.md) | Creates a new Angular app using the Angular CLI. (from the Angular team, see `vendor.json`) |
| [`angular-patterns`](angular-patterns/SKILL.md) | Angular patterns and gotchas - async state as a discriminated union (AsyncState instead of loading/error boolean flags), @let type narrowing in templates, declarative RxJS streams for search and streaming, signals with ngModel and form inputs, and fixing ng serve port collisions or orphaned Node processes on Windows. |

To add a skill here: create `<name>/SKILL.md` with `name` and `description` frontmatter and add a row above. The installer finds it on its own.
