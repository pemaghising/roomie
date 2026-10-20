"""Runs compare.py for a list of (route, figma-name, session) and prints any page errors.
Usage: python scripts/compare_batch.py <scratch dir> <batch.json>  — batch: [[route, figName, sessionFileOrNull], ...]
Figma PNGs are read from <scratch>/fig/<figName>.png, outputs go to <scratch>/cmp-<figName>.png.
"""
import json, subprocess, sys
from pathlib import Path

scratch = Path(sys.argv[1]); batch = json.loads(Path(sys.argv[2]).read_text())
here = Path(__file__).parent
for route, fig, session in batch:
    cmd = [sys.executable, "-I", str(here / "compare.py"), "--route", route, "--out", str(scratch / f"cmp-{fig}.png"), "--wait", "6000"]
    if (scratch / "fig" / f"{fig}.png").exists(): cmd += ["--figma", str(scratch / "fig" / f"{fig}.png")]
    if session: cmd += ["--session", str(scratch / session)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(fig, route, (r.stdout.strip().splitlines() or [r.stderr.strip()[-300:]])[-1][-240:])
