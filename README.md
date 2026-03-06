# 🚀 DevTrackr

**Automatically turn your coding activity into a clean, professional developer logbook.**

![Frontend Badge](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![Backend Badge](https://img.shields.io/badge/Backend-FastAPI-green)
![Database Badge](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Runtime Badge](https://img.shields.io/badge/Runtime-Bun-orange)
![AI Badge](https://img.shields.io/badge/AI-Pluggable%20Providers-purple)
![License Badge](https://img.shields.io/badge/License-MIT-black)

## 🏁 Getting Started

To get started with DevTrackr, please follow our detailed **[Setup Guide](./docs/setup-guide.md)**.

It covers:
- Prerequisites & Installation
- Code Quality & Formatting
- API Client Synchronization
- Database Migrations
- Running Locally with Docker

---

## 🧠 What is DevTrackr?

**DevTrackr** is a developer-focused productivity and documentation platform that automatically generates **structured, professional logbooks** by combining:

- ⏱️ Time tracking data
- 🧑‍💻 GitHub activity (commits, PRs, issues)
- 🤖 AI-powered summaries

Whether you’re logging hours for:

- payroll
- internships / industrial training
- academic requirements
- or personal accountability

DevTrackr eliminates manual logging so you can focus on building.

---

## 🧩 Problem Statement

Developers are often required to maintain detailed work logs describing:

- what they worked on
- how long it took
- and where the work can be verified

Today, this means juggling multiple tools:

- time trackers (e.g. Toggl)
- GitHub
- documents or note-taking apps
- separate AI tools for summarization

This process is repetitive, fragmented, and error-prone.

**DevTrackr solves this by acting as the glue between your tools.**

---

## ✨ Key Features

### ⏱️ Time Tracking Integration

- Sync time entries from Toggl (and compatible open-source alternatives)
- Group logs by project, date, or task
- Standardized log entry format

### 🧑‍💻 GitHub Integration

- Automatically link:
  - commits
  - pull requests
  - issues
- Match GitHub activity to time entries
- No more manual copy-pasting

### 📒 Automatic Logbook Generation

- Daily, weekly, or project-based logbooks
- Rich entries:
  - descriptions
  - links
  - images
  - notes
- Export-friendly formats (planned)

### 🤖 AI-Powered Summaries

- Daily or weekly summaries
- Automatic categorization of work
- Highlight key accomplishments
- Pluggable AI providers:
  - Gemini API
  - Local LLMs (planned)

### 📊 Insights & Reflection (Planned)

- Time distribution by project/category
- Productivity trends
- Work pattern analysis

---

## 🧱 Tech Stack

### Frontend

- **React + TypeScript**
- **Vite**
- **TanStack Router**
- **TanStack Query**
- **Biome** (formatting & linting)
- **Bun**

### Backend

- **FastAPI**
- **uv** (Python dependency management)
- **PostgreSQL**
- **SQLAlchemy**
- **Alembic**

### AI Layer

- Provider-agnostic interface
- Gemini API
- Local inference support (planned)

### DevOps & Infrastructure

- **Docker & Docker Compose**
- **Self-hosted deployment**
- **CI/CD (GitHub Actions)**

---

## 📁 Monorepo Structure

    devtrackr/
    ├── frontend/           # React application
    ├── backend/            # FastAPI backend
    ├── docker-compose.yml
    ├── docker-compose.override.yml
    ├── .github/            # CI/CD workflows
    ├── README.md

---

## 🎯 Project Goals

DevTrackr is intentionally designed as a **learning-driven project**.

Key goals:

- Master Docker and containerized workflows
- Build real-world CI/CD pipelines
- Learn API integrations (GitHub, time tracking tools)
- Understand database migrations and schema evolution
- Design pluggable AI systems
- Practice collaborative development workflows

---

## 🗺️ Roadmap

### ✅ Completed / In Progress

- [x] Project ideation & scope definition
- [x] Tech stack selection
- [x] Frontend scaffolding (React + Vite + Bun)
- [x] Formatting & linting setup (Biome)
- [x] Dockerization
- [x] Prestart service to docker compose
- [x] Alembic for db migrations

### ⏳ Planned

- [ ] FastAPI application structure
- [ ] Database schema design
- [ ] GitHub OAuth & API integration
- [ ] Time tracking provider integration (Toggl)
- [ ] AI summarization pipeline
- [ ] CI/CD pipeline
- [ ] Self-hosted deployment
- [ ] Redis service integration through docker

---

## 🤝 Contributors

- **Muhd-Mairaj**
- **ferrxuS**

---

## 🌱 Vision

DevTrackr aims to become the **default personal activity ledger for developers** — a place where work is automatically captured, summarized, and presented professionally.

> *Write fewer logs. Build more things.*

---

## 📜 License

MIT
