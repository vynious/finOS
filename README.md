# finOS

> **finOS** is a self-hosted, automated finance tracker.
> It ingests transaction alerts from your email, normalizes them into a structured timeline, and gives you a privacy-first dashboard for managing your spending.

* ⚙️ **Rust backend** — fast, reliable, and secure API.
* 💻 **Next.js PWA frontend** — installable web app with offline support & push notifications.
* 📩 **Email integration** — connect multiple email accounts; supports both polling and Pub/Sub ingestion.
* 🗄 **NoSQL storage** — flexible document model for accounts & transactions.

---

## ✨ Features

* **Multi-email ingestion** — hook up Gmail or IMAP accounts.
* **Automated parsing** — extract amount, merchant, currency, and time.
* **Deduplication** — prevents duplicate alerts across emails.
* **Real-time updates** — transactions appear instantly in the dashboard.
* **Cross-platform** — works on desktop and mobile (PWA).
* **Privacy-first** — all data stays on your infra.

---

## 📐 Architecture

```
[ Emails ] → [ Ingestion Worker ] → [ Rust API ] → [ MongoDB ]
                                      ↑
                         [ Next.js PWA Frontend ]
```

* **Ingestion worker**: pulls or subscribes to new emails.
* **Rust API**: normalizes, deduplicates, and exposes data.
* **MongoDB**: document store for accounts & transactions.
* **Next.js PWA**: user dashboard with notifications & analytics.

---

## 🚀 Getting Started

1. **Clone** the repo.
2. **Set up environment** variables for your email provider & database.
3. **Run services** with Docker Compose or directly via `cargo` / `pnpm`.
4. Open the PWA and start connecting your inbox.

---

## 🗂 Project Structure

```
finos/

```

---

## 📊 Roadmap

* [ ] Categorization & budgeting


---
