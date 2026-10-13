#!/usr/bin/env python3
"""Narration with Microsoft Edge's free neural voices (edge-tts), plus per-word timings.

Usage:  python3 scripts/tts_edge.py jobs.json
jobs.json is a list of {"text", "voice", "rate", "out", "words"} objects. For each job
it writes the mp3 to `out` and a JSON list of {w, start, end} (seconds) to `words`.
Install once with:  pip install edge-tts
"""
import asyncio
import json
import sys

try:
    import edge_tts
    # Temporary shim (Oct 2026): Microsoft refuses synthesis on the legacy
    # host with 403 (rany2/edge-tts#490). Edge 155 uses
    # api.msedgeservices.com, which accepts the same token as
    # Ocp-Apim-Subscription-Key (unmerged PR #491). Remove once the
    # installed edge-tts already points at the new host.
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


async def main():
    with open(sys.argv[1], encoding="utf-8") as f:
        jobs = json.load(f)
    for i, job in enumerate(jobs):
        for attempt in range(3):
            try:
                await synth(job)
                break
            except Exception as err:  # network hiccups: retry a couple of times
                if attempt == 2:
                    print(f"edge-tts failed on scene {i + 1}: {err}", file=sys.stderr)
                    sys.exit(4)
                await asyncio.sleep(1.5 * (attempt + 1))
        print(f"  voice {i + 1}/{len(jobs)}", flush=True)


asyncio.run(main())
