# Setup Guide

This guide explains how every team member should set up the project after cloning the repository.

---

# Prerequisites

Before cloning the project, install the following software.

## 1. Git

Download and install Git

https://git-scm.com/downloads

Verify installation

```bash
git --version
```

---

## 2. Node.js

Install Node.js (LTS version recommended).

Download:

https://nodejs.org/

Verify

```bash
node -v
npm -v
```

---

## 3. Python

Install Python **3.11**

Download

https://www.python.org/downloads/

Verify

```bash
py -3.11 --version
```

Do NOT use Python 3.9 for Catalyst Functions because the latest Catalyst SDK requires Python >=3.10.

---

## 4. Zoho Catalyst CLI

Install globally

```bash
npm install -g zcatalyst-cli
```

Verify

```bash
catalyst --version
```

---

# Clone Repository

Clone the GitHub repository

```bash
git clone <REPOSITORY_URL>
```

Open the project

```bash
cd crime-analysis-platform
```

---

# Login to Catalyst

Each team member must login using **their own Zoho account**.

```bash
catalyst login
```

A browser window opens.

Complete authentication.

---

# Select the Project

After login,

Run

```bash
catalyst project:use
```

Choose

```
crime-analysis-platform
```

If you cannot see the project,

contact the Team Lead to be added as a Project Member in Zoho Catalyst.

---

# Verify Project

Run

```bash
catalyst project:list
```

The active project should be

```
crime-analysis-platform
```

---

# Install Dependencies

Only install dependencies for the module you are working on.

---

# Frontend Engineer

Move to

```bash
cd crime-analysis-platform-ui
```

Install packages

```bash
npm install
```

Run

```bash
npm run dev
```

Open the URL shown by Vite.

---

# Slate Developer

Move to

```bash
cd crime-analysis-slate
```

Install

```bash
npm install
```

Run

```bash
npm run dev
```

---

# Backend / Functions Developer

Move to

```bash
cd functions/crime_analysis_platform_function
```

Create virtual environment

```bash
py -3.11 -m venv .venv
```

Activate

Windows

```bash
.venv\Scripts\activate
```

Upgrade pip

```bash
python -m pip install --upgrade pip
```

Install dependencies

```bash
python -m pip install -r requirements.txt
```

Deactivate after work

```bash
deactivate
```

---

# AI / ML Engineer

Move to

```bash
cd appsail-python
```

(Optional) Create a virtual environment

```bash
py -3.11 -m venv .venv
```

Activate

```bash
.venv\Scripts\activate
```

Install packages

```bash
python -m pip install -r requirements.txt
```

Whenever new packages are added,

update

```
requirements.txt
```

before committing.

---

# Environment Variables

Never commit

```
.env
```

Copy

```
.env.example
```

to

```
.env
```

Fill in your own values.

Example

```
CATALYST_PROJECT_ID=

CATALYST_ENVIRONMENT=

API_KEY=
```

---

# Git Workflow

Always pull the latest changes before starting work.

```bash
git pull origin main
```

Create your own feature branch.

Example

```bash
git checkout -b feature/frontend
```

Other examples

```
feature/functions

feature/ml

feature/network

feature/devops
```

Never develop directly on

```
main
```

---

# Commit Changes

Check status

```bash
git status
```

Add files

```bash
git add .
```

Commit

```bash
git commit -m "Implemented hotspot visualization"
```

Push

```bash
git push origin feature/frontend
```

Create a Pull Request on GitHub.

---

# Pull Latest Changes

Before starting work every day

```bash
git checkout main

git pull origin main
```

Then switch back

```bash
git checkout feature/<branch-name>
```

Merge latest changes

```bash
git merge main
```

Resolve conflicts if necessary.

---

# Folder Responsibilities

## Frontend Engineer

Work only inside

```
crime-analysis-platform-ui/
```

---

## Backend Engineer

Work only inside

```
functions/
```

---

## AI Engineer

Work only inside

```
appsail-python/
```

---

## DevOps Engineer

Work on

```
Catalyst Console

Deployment

Cron

Signals

Circuits

SmartBrowz
```

---

## Team Lead

Responsible for

- Integration
- API Gateway
- Authentication
- Database
- Catalyst Services
- Code Reviews

---

# Do NOT Commit

Never commit

```
node_modules/

.venv/

__pycache__/

.env

logs/

dist/

build/
```

These are already ignored by `.gitignore`.

---

# Troubleshooting

## npm install fails

Delete

```
node_modules
```

Run

```bash
npm install
```

---

## Python package fails

Verify

```bash
py -3.11 --version
```

Do not use Python 3.9.

---

## Catalyst project not found

Run

```bash
catalyst login
```

again.

If the project still doesn't appear,

contact the Team Lead.

---

## Cannot push to GitHub

Verify

```bash
git remote -v
```

Make sure you have write access to the repository.

---

# Daily Workflow

1. Pull latest changes

2. Switch to your feature branch

3. Complete your assigned module

4. Test locally

5. Commit

6. Push

7. Create Pull Request

8. Wait for review

9. Merge into main

---

### AppSail on Windows

When running `catalyst serve` on Windows, you may see:

```text
'python3' is not recognized as an internal or external command
```

This happens because the AppSail configuration targets the Linux runtime used by Zoho Catalyst, where `python3` is the standard executable.

For local development, start the AppSail service manually:

```bash
cd appsail-python
python app.py
```

or activate the project's virtual environment and then run:

```bash
python app.py
```

When deployed to Zoho Catalyst, no changes to `app-config.json` are required.

---


| Team Member               | Responsibility                                  | Main Working Folder                                                    |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Team Lead                 | Backend, Integration, API Gateway               | `functions/`, Catalyst Console                                         |
| Frontend Engineer         | Dashboard, Maps, Charts                         | `crime-analysis-platform-ui/`                                          |
| AI/ML Engineer            | Models, AppSail APIs                            | `appsail-python/`                                                      |
| Network Analysis Engineer | Link analysis, graph APIs                       | `functions/` (or a dedicated `network-analysis/` module as it evolves) |
| DevOps Engineer           | Deployment, Cron, Signals, Circuits, SmartBrowz | Catalyst Console + project configuration                               |
