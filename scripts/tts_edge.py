#!/usr/bin/env python3
"""Narration with Microsoft Edge's free neural voices (edge-tts), plus per-word timings.

Usage:  python3 scripts/tts_edge.py jobs.json
jobs.json is a list of {"text", "voice", "rate", "out", "words"} objects. For each job
it writes the mp3 to `out` and a JSON list of {w, start, end} (seconds) to `words`.
Install once with:  pip install edge-tts
"""
import asyncio
import json
import os
import sys

try:
    import edge_tts
    from importlib.metadata import version as _pkg_version

    # Oct 2026: Microsoft started refusing the old request signature with 403
    # (rany2/edge-tts#490). edge-tts 7.3.0+ fixes it on the official host (new
    # Sec-MS-GEC, version "2-…"). For older versions only, fall back to the
    # temporary shim that sends the request to api.msedgeservices.com instead.
    # Upgrade with:  pip install -U edge-tts
    def _version_tuple(v):
        return tuple(int(x) for x in v.split(".")[:3] if x.isdigit())

    try:
        _old = _version_tuple(_pkg_version("edge-tts")) < (7, 3, 0)
    except Exception:
        _old = False
    if _old:
        print("  edge-tts is older than 7.3: using the temporary host shim (run: pip install -U edge-tts)", file=sys.stderr)
        try:
            from edge_tts import constants as _edge_constants

            if "speech.platform.bing.com" in getattr(_edge_constants, "WSS_URL", ""):
                _new_wss = (
                    "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1"
                    f"?Ocp-Apim-Subscription-Key={_edge_constants.TRUSTED_CLIENT_TOKEN}"
                )
                _edge_constants.WSS_URL = _new_wss
                try:
                    from edge_tts import communicate as _edge_communicate

                    _edge_communicate.WSS_URL = _new_wss
                except ImportError:
                    pass
        except ImportError:
            pass
except ImportError:
    print("edge-tts is not installed. Run: pip install edge-tts", file=sys.stderr)
    sys.exit(3)


async def synth(job):
    kwargs = {"voice": job["voice"], "rate": job.get("rate", "+0%")}
    try:
        # edge-tts >= 7 only emits word timings when asked for them.
        com = edge_tts.Communicate(job["text"], boundary="WordBoundary", **kwargs)
    except TypeError:
        com = edge_tts.Communicate(job["text"], **kwargs)
    words = []
    with open(job["out"], "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                end = start + chunk["duration"] / 1e7
                words.append({"w": chunk["text"], "start": round(start, 3), "end": round(end, 3)})
    with open(job["words"], "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)


def _key(job):
    return json.dumps([job["text"], job["voice"], job.get("rate", "+0%")], ensure_ascii=False)


def _cached(job):
    """The scene was already voiced with this exact text, voice and rate: reuse it."""
    try:
        with open(job["out"] + ".key", encoding="utf-8") as f:
            if f.read() != _key(job):
                return False
        return os.path.getsize(job["out"]) > 0 and os.path.exists(job["words"])
    except OSError:
        return False


async def main():
    with open(sys.argv[1], encoding="utf-8") as f:
        jobs = json.load(f)
    for i, job in enumerate(jobs):
        if _cached(job):
            print(f"  voice {i + 1}/{len(jobs)} (cached)", flush=True)
            continue
        # Microsoft answers 429 when too many requests arrive in a short time: wait and
        # retry with growing pauses (about 2 minutes in total) before giving up.
        waits = [2, 5, 15, 30, 60]
        for attempt in range(len(waits) + 1):
            try:
                await synth(job)
                break
            except Exception as err:
                if attempt == len(waits):
                    print(f"edge-tts failed on scene {i + 1}: {err}", file=sys.stderr)
                    print("  Microsoft's voice service is limiting requests: wait a few minutes and run it again"
                          " (scenes already voiced are reused).", file=sys.stderr)
                    sys.exit(4)
                wait = waits[attempt] if "429" in str(err) else min(waits[attempt], 5)
                print(f"  scene {i + 1}: {str(err)[:60]}… retrying in {wait} s", file=sys.stderr, flush=True)
                await asyncio.sleep(wait)
        with open(job["out"] + ".key", "w", encoding="utf-8") as f:
            f.write(_key(job))
        print(f"  voice {i + 1}/{len(jobs)}", flush=True)
        await asyncio.sleep(0.6)  # a short pause between scenes keeps under the rate limit


asyncio.run(main())
