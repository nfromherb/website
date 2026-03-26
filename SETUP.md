# Mac Dashboard — Setup Guide

A personal macOS dashboard with Apple Mail, Reminders, Notes, Weather, News, X feed, and Claude AI.

## Prerequisites

- **macOS** (required — uses AppleScript for Apple app integration)
- **Node.js 18+** (`brew install node`)
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your API key

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
WEATHER_CITY=New York   # or your city
```

### 3. Run in development mode

```bash
npm run dev
```

The dashboard opens as a native Mac window.

### 4. Build a distributable .dmg

```bash
npm run package
```

The `.dmg` file will be in the `release/` folder.

## macOS Permissions

On first launch, macOS will ask for permission to access:
- **Mail** — to read your unread emails
- **Reminders** — to read and create reminders
- **Notes** — to read and create notes

Click **Allow** when prompted. You can manage these in:
> System Settings → Privacy & Security → Automation

## Features

| Panel | Description |
|-------|-------------|
| **Weather** | Current conditions + hourly forecast via Open-Meteo (free, no key needed) |
| **Mail** | Unread emails from Apple Mail via AppleScript |
| **Reminders** | Apple Reminders — view, complete, and add tasks |
| **Notes** | Apple Notes — view and create notes |
| **To-Do** | Local to-do list stored in SQLite (separate from Reminders) |
| **News** | Top stories from BBC, NPR, NYT via RSS |
| **X Feed** | Trending posts via public Nitter RSS (no Twitter API needed) |
| **Claude AI** | Persistent sidebar with context from all your panels |

## Claude AI Integration

Claude has read access to a snapshot of your dashboard (emails, tasks, notes, weather, news) and acts as your personal executive assistant. Try asking:

- *"Summarize my unread emails"*
- *"What should I prioritize today?"*
- *"Draft a note about my meeting next week"*
- *"What's the weather like for my commute?"*

## Settings

Click the ⚙ icon in the sidebar to configure:
- Anthropic API key
- Weather city
- Nitter instance (for X feed)
- Email display count

## Troubleshooting

**Mail/Reminders/Notes not loading?**
> Go to System Settings → Privacy & Security → Automation and ensure "Mac Dashboard" has permission to control Mail, Reminders, and Notes.

**X feed not loading?**
> Nitter instances go down occasionally. Change the Nitter instance in Settings. Public instances: `nitter.poast.org`, `nitter.privacydev.net`.

**Claude not responding?**
> Check your API key in Settings. Make sure it starts with `sk-ant-`.
