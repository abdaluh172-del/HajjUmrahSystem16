# -*- coding: utf-8 -*-
"""Fetch public comments/opinions about Hajj & Umrah — OFFICIAL APIs ONLY.

v12. No scraping anywhere in this module: every request goes to the
platform's documented, official API using credentials the site owner
provides via environment variables. If a credential is missing, that
source is simply skipped (the app keeps working normally without it).

Environment variables (all optional):
    YOUTUBE_API_KEY        Google API key with YouTube Data API v3 enabled
    REDDIT_CLIENT_ID       Reddit "script" app credentials
    REDDIT_CLIENT_SECRET   (OAuth2 client-credentials flow)
    REDDIT_USER_AGENT      e.g. "HajjUmrahSystem/1.0 by <reddit-username>"
    X_BEARER_TOKEN         X (Twitter) API v2 Bearer token (recent search)
    EXTERNAL_SEARCH_QUERY  override the default search query
    FETCH_INTERVAL_MINUTES auto-refresh period (default 60 = hourly)
    AUTO_FETCH_EXTERNAL    set to "0" to disable the hourly auto-refresh

Compliance notes:
  * Only public content returned by the official endpoints is stored.
  * Each stored comment keeps its source ('youtube'/'reddit'/'x') and the
    platform's own item id (external_id) so it is never duplicated and its
    origin is always visible in the UI.
  * Request volumes are tiny (a few calls per run) — far below every
    platform's rate limits.

Each fetcher returns a list of dicts:
    {"external_id", "text", "author", "created_at", "source"}
and NEVER raises — network/auth problems are logged and yield [].
"""
import os
from datetime import datetime, timezone

import requests

DEFAULT_QUERY = "Hajj Umrah experience"
TIMEOUT = 15  # seconds per HTTP request


def _query() -> str:
    return os.environ.get("EXTERNAL_SEARCH_QUERY") or DEFAULT_QUERY


def configured_sources() -> dict:
    """Which sources have credentials set (used by the admin status panel)."""
    return {
        "youtube": bool(os.environ.get("YOUTUBE_API_KEY")),
        "reddit": bool(os.environ.get("REDDIT_CLIENT_ID") and os.environ.get("REDDIT_CLIENT_SECRET")),
        "x": bool(os.environ.get("X_BEARER_TOKEN")),
    }


# ------------------------------------------------------------------ #
# YouTube Data API v3 (official): search videos, then read their
# top-level comment threads.
# ------------------------------------------------------------------ #
def fetch_youtube(max_videos: int = 3, max_comments_per_video: int = 15) -> list:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        return []
    out = []
    try:
        r = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={"part": "id", "q": _query(), "type": "video",
                    "maxResults": max_videos, "key": key},
            timeout=TIMEOUT)
        r.raise_for_status()
        video_ids = [it["id"]["videoId"] for it in r.json().get("items", [])
                     if it.get("id", {}).get("videoId")]
        for vid in video_ids:
            try:
                cr = requests.get(
                    "https://www.googleapis.com/youtube/v3/commentThreads",
                    params={"part": "snippet", "videoId": vid, "textFormat": "plainText",
                            "maxResults": max_comments_per_video, "key": key},
                    timeout=TIMEOUT)
                cr.raise_for_status()
                for it in cr.json().get("items", []):
                    sn = it["snippet"]["topLevelComment"]["snippet"]
                    out.append({
                        "external_id": "youtube:" + it["snippet"]["topLevelComment"]["id"],
                        "text": (sn.get("textDisplay") or "").strip(),
                        "author": sn.get("authorDisplayName") or "YouTube user",
                        "created_at": sn.get("publishedAt") or datetime.now(timezone.utc).isoformat(),
                        "source": "youtube",
                    })
            except Exception as e:  # one bad video must not stop the rest
                print(f"[external] youtube comments for {vid} failed: {e}")
    except Exception as e:
        print(f"[external] youtube search failed: {e}")
    return [c for c in out if c["text"]]


# ------------------------------------------------------------------ #
# Reddit API (official OAuth2 client-credentials flow).
# ------------------------------------------------------------------ #
def fetch_reddit(max_posts: int = 20) -> list:
    cid = os.environ.get("REDDIT_CLIENT_ID")
    secret = os.environ.get("REDDIT_CLIENT_SECRET")
    agent = os.environ.get("REDDIT_USER_AGENT") or "HajjUmrahSystem/1.0"
    if not (cid and secret):
        return []
    out = []
    try:
        tok = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(cid, secret), data={"grant_type": "client_credentials"},
            headers={"User-Agent": agent}, timeout=TIMEOUT)
        tok.raise_for_status()
        access = tok.json()["access_token"]
        r = requests.get(
            "https://oauth.reddit.com/search",
            params={"q": _query(), "limit": max_posts, "sort": "new", "type": "link"},
            headers={"Authorization": f"Bearer {access}", "User-Agent": agent},
            timeout=TIMEOUT)
        r.raise_for_status()
        for child in r.json().get("data", {}).get("children", []):
            d = child.get("data", {})
            text = (d.get("selftext") or d.get("title") or "").strip()
            if not text:
                continue
            created = d.get("created_utc")
            out.append({
                "external_id": "reddit:" + str(d.get("id")),
                "text": text[:2000],
                "author": "u/" + (d.get("author") or "reddit"),
                "created_at": (datetime.fromtimestamp(created, tz=timezone.utc).isoformat()
                               if created else datetime.now(timezone.utc).isoformat()),
                "source": "reddit",
            })
    except Exception as e:
        print(f"[external] reddit fetch failed: {e}")
    return out


# ------------------------------------------------------------------ #
# X (Twitter) API v2 (official): recent search. Requires a plan whose
# permissions include recent search — if the token lacks access the
# request simply fails and this source yields nothing.
# ------------------------------------------------------------------ #
def fetch_x(max_results: int = 25) -> list:
    bearer = os.environ.get("X_BEARER_TOKEN")
    if not bearer:
        return []
    out = []
    try:
        r = requests.get(
            "https://api.twitter.com/2/tweets/search/recent",
            params={"query": f"({_query()}) -is:retweet",
                    "max_results": max(10, min(max_results, 100)),
                    "tweet.fields": "created_at,author_id"},
            headers={"Authorization": f"Bearer {bearer}"}, timeout=TIMEOUT)
        r.raise_for_status()
        for tw in r.json().get("data", []) or []:
            out.append({
                "external_id": "x:" + str(tw["id"]),
                "text": (tw.get("text") or "").strip(),
                "author": "X user " + str(tw.get("author_id") or ""),
                "created_at": tw.get("created_at") or datetime.now(timezone.utc).isoformat(),
                "source": "x",
            })
    except Exception as e:
        print(f"[external] x fetch failed: {e}")
    return [c for c in out if c["text"]]


def fetch_all() -> list:
    """Fetch from every configured source. Unconfigured sources yield []."""
    return fetch_youtube() + fetch_reddit() + fetch_x()
