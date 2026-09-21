#!/usr/bin/env python3
"""8x assignment capture hook: log prompt + final response per turn to .agent-logs/.

Fires on UserPromptSubmit (payload: prompt) and Stop (payload: last_assistant_message).
Writes one markdown file per session, format per 8x spec. Entries are append-only;
only frontmatter counters are updated after creation.
"""

import glob
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

PROJECT = os.environ.get("DEVIN_PROJECT_DIR") or os.getcwd()
LOG_DIR = os.path.join(PROJECT, ".agent-logs")
TRANSCRIPTS_DIR = os.path.expanduser("~/.local/share/devin/cli/transcripts")
DEBUG_DIR = "/tmp/devin-hook-stdin"
TOOL = "devin-cli"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def detect_model(session_id: str) -> str:
    # 1. Live/ended transcript whose session_id matches this hook session
    try:
        for path in sorted(
            glob.glob(os.path.join(TRANSCRIPTS_DIR, "*.json")),
            key=os.path.getmtime,
            reverse=True,
        ):
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("session_id") == session_id:
                    name = (data.get("agent") or {}).get("model_name")
                    if name:
                        return name
            except (OSError, ValueError):
                continue
    except OSError:
        pass
    # 2. Env override
    if os.environ.get("DEVIN_MODEL"):
        return os.environ["DEVIN_MODEL"]
    # 3. User config default
    try:
        with open(os.path.expanduser("~/.config/devin/config.json"), encoding="utf-8") as f:
            model = (json.load(f).get("agent") or {}).get("model")
        if model:
            return model
    except (OSError, ValueError):
        pass
    return "unknown"


def detect_author() -> str:
    try:
        with open(os.path.expanduser("~/.config/gh/hosts.yml"), encoding="utf-8") as f:
            m = re.search(r"^\s*user:\s*(\S+)", f.read(), re.M)
        if m:
            return m.group(1)
    except OSError:
        pass
    try:
        name = subprocess.run(
            ["git", "config", "user.name"], capture_output=True, text=True, timeout=5
        ).stdout.strip()
        if name:
            return name
    except (OSError, subprocess.SubprocessError):
        pass
    return os.environ.get("USER", "unknown")


def find_session_file(session_id: str):
    if not os.path.isdir(LOG_DIR):
        return None
    needle = f"session_id: {session_id}\n"
    for path in sorted(glob.glob(os.path.join(LOG_DIR, "*.md"))):
        try:
            with open(path, encoding="utf-8") as f:
                if needle in f.read(3000):
                    return path
        except OSError:
            continue
    return None


def create_session_file(session_id: str, ts: datetime, model: str, author: str) -> str:
    os.makedirs(LOG_DIR, exist_ok=True)
    safe_sid = re.sub(r"[^A-Za-z0-9_.-]", "_", session_id)
    name = f"{ts.strftime('%Y-%m-%d_%H-%M-%S')}_{safe_sid}.md"
    path = os.path.join(LOG_DIR, name)
    project = os.path.basename(PROJECT.rstrip("/"))
    date = ts.strftime("%Y-%m-%d")
    header = f"""---
session_id: {session_id}
date: {date}
author: {author}
model: {model}
tool: {TOOL}
project: {project}
total_exchanges: 0
first_prompt_time: {iso(ts)}
last_prompt_time: {iso(ts)}
---

# Session Log - {date}

Session: `{session_id[:8]}` | Project: `{project}` | Author: `{author}`

---
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(header)
    return path


def update_frontmatter(path: str, total: int, last_ts: str) -> None:
    with open(path, encoding="utf-8") as f:
        content = f.read()
    m = re.match(r"(---\n.*?\n---\n)(.*)", content, re.S)
    if not m:
        return
    fm, rest = m.groups()
    fm = re.sub(r"total_exchanges: \d+", f"total_exchanges: {total}", fm)
    fm = re.sub(r"last_prompt_time: .*", f"last_prompt_time: {last_ts}", fm)
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm + rest)


def count_prompts(content: str) -> int:
    return len(re.findall(r"^\[LOG_ENTRY type=PROMPT ", content, re.M))


def last_entry_is_prompt(content: str) -> bool:
    entries = re.findall(r"^\[LOG_ENTRY type=(\w+)", content, re.M)
    return bool(entries) and entries[-1] == "PROMPT"


def append_entry(path: str, etype: str, num: int, session_id: str, ts: str, model: str, body: str) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(
            f"\n[LOG_ENTRY type={etype} num={num} session={session_id[:8]}]\n"
            f"timestamp: {ts}\n"
            f"model: {model}\n\n"
            f"{body.rstrip()}\n"
        )


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except ValueError:
        return

    # Raw stdin dump for setup verification (not shipped; lives in /tmp)
    try:
        os.makedirs(DEBUG_DIR, exist_ok=True)
        with open(os.path.join(DEBUG_DIR, "events.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps({"ts": iso(utc_now()), "payload": payload}) + "\n")
    except OSError:
        pass

    event = payload.get("hook_event_name")
    session_id = payload.get("session_id") or "unknown-session"
    ts = utc_now()
    model = detect_model(session_id)
    author = detect_author()

    if event == "UserPromptSubmit":
        prompt = payload.get("prompt")
        if prompt is None:
            return
        path = find_session_file(session_id) or create_session_file(session_id, ts, model, author)
        with open(path, encoding="utf-8") as f:
            num = count_prompts(f.read()) + 1
        append_entry(path, "PROMPT", num, session_id, iso(ts), model, prompt)
        update_frontmatter(path, num, iso(ts))
    elif event == "Stop":
        path = find_session_file(session_id)
        if not path:
            return
        with open(path, encoding="utf-8") as f:
            content = f.read()
        # Only pair a RESPONSE with an unanswered PROMPT (dedupes repeat Stop fires)
        if not last_entry_is_prompt(content):
            return
        num = count_prompts(content)
        message = payload.get("last_assistant_message")
        if message is None:
            message = payload.get("response") or payload.get("message") or ""
        append_entry(path, "RESPONSE", num, session_id, iso(ts), model, str(message))


if __name__ == "__main__":
    main()
