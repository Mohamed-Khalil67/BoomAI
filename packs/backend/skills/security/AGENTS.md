# Security skills

Authentication, authorization and security review.

| Skill | Use it for |
|---|---|
| [`auth-jwt`](auth-jwt/SKILL.md) | Implements and reviews authentication and authorization in NestJS - JWT access tokens, rotating refresh tokens, a global auth guard with a @Public() decorator, role checks, password hashing, cookies and login rate limits. |
| [`security-review`](security-review/SKILL.md) | Security code review for vulnerabilities. (from Sentry, see `vendor.json`) |

To add a skill here: create `<name>/SKILL.md` with `name` and `description` frontmatter and add a row above. The installer finds it on its own.
