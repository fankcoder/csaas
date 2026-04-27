import argparse
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LOOKPRICE_DIR = Path(__file__).resolve().parent

PLATFORM_SCRIPTS = {
    "buff": "buff_spider.py",
    "buff_spider": "buff_spider.py",
    "uu": "uu_spider.py",
    "youpin": "uu_spider.py",
    "uu_spider": "uu_spider.py",
    "waxpeer": "waxpeer.py",
    "waxper": "waxpeer.py",
    "shadow": "shadow.py",
    "shadowpay": "shadow.py",
}

DEFAULT_PLATFORMS = ("buff", "uu", "waxpeer", "shadow")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Fetch CS:GO price data from multiple platforms concurrently."
    )
    parser.add_argument(
        "platforms",
        nargs="*",
        help=(
            "Platforms to fetch. Defaults to: buff uu waxpeer shadow. "
            "Aliases: buff_spider, uu_spider, youpin, waxper, shadowpay."
        ),
    )
    parser.add_argument(
        "-j",
        "--max-workers",
        type=int,
        default=None,
        help="Maximum concurrent platform scripts. Defaults to selected platform count.",
    )
    parser.add_argument(
        "--python",
        default=sys.executable,
        help="Python executable used to run platform scripts.",
    )
    return parser.parse_args()


def resolve_platforms(platforms):
    requested = platforms or list(DEFAULT_PLATFORMS)
    resolved = []
    seen_scripts = set()

    for platform in requested:
        key = platform.lower()
        script_name = PLATFORM_SCRIPTS.get(key)
        if script_name is None:
            choices = ", ".join(sorted(PLATFORM_SCRIPTS))
            raise ValueError(f"Unknown platform '{platform}'. Choices: {choices}")

        if script_name in seen_scripts:
            continue

        script_path = LOOKPRICE_DIR / script_name
        if not script_path.exists():
            raise FileNotFoundError(f"Platform script not found: {script_path}")

        seen_scripts.add(script_name)
        resolved.append((key, script_path))

    return resolved


def run_platform(name, script_path, python_executable):
    start = time.monotonic()
    command = [python_executable, str(script_path)]

    process = subprocess.Popen(
        command,
        cwd=str(REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
        bufsize=1,
    )

    assert process.stdout is not None
    for line in process.stdout:
        print(f"[{name}] {line}", end="", flush=True)

    return_code = process.wait()
    elapsed = time.monotonic() - start
    return {
        "name": name,
        "script": script_path.name,
        "return_code": return_code,
        "elapsed": elapsed,
    }


def main():
    args = parse_args()

    try:
        platforms = resolve_platforms(args.platforms)
    except (FileNotFoundError, ValueError) as exc:
        print(exc, file=sys.stderr)
        return 2

    if not platforms:
        print("No platforms selected.", file=sys.stderr)
        return 2

    max_workers = args.max_workers or len(platforms)
    if max_workers < 1:
        print("--max-workers must be greater than 0.", file=sys.stderr)
        return 2

    print(
        "Starting platforms: "
        + ", ".join(f"{name}({script_path.name})" for name, script_path in platforms),
        flush=True,
    )

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(run_platform, name, script_path, args.python)
            for name, script_path in platforms
        ]
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            status = "OK" if result["return_code"] == 0 else "FAIL"
            print(
                f"[{result['name']}] {status} "
                f"exit={result['return_code']} elapsed={result['elapsed']:.1f}s",
                flush=True,
            )

    failures = [result for result in results if result["return_code"] != 0]

    print("\nSummary:")
    for result in sorted(results, key=lambda item: item["name"]):
        status = "OK" if result["return_code"] == 0 else "FAIL"
        print(
            f"  {result['name']}: {status} "
            f"({result['script']}, {result['elapsed']:.1f}s)"
        )

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
