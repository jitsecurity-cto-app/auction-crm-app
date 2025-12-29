# Security Vulnerabilities - CRM App

This app intentionally contains security vulnerabilities for educational purposes.

## Vulnerabilities

1. **XSS (Cross-Site Scripting)** - User input rendered without sanitization
2. **Missing Authorization** - Client-side only permission checks
3. **Weak Authentication** - Tokens stored in localStorage
4. **Insecure Storage** - Sensitive admin data in localStorage
5. **No Input Validation** - Client-side only validation

See main `SECURITY.md` for details.

**⚠️ Never deploy to production without fixing these vulnerabilities.**

