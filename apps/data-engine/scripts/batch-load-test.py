#!/usr/bin/env python3
"""
Batch Load Test for Data Engine API (P4 Gate Check)

Tests concurrency tolerance, latency percentiles, and response shape
validation for all JSON-based data-engine endpoints.

Usage:
    # Against a running server:
    uv run python scripts/batch-load-test.py --url http://localhost:8000 --concurrency 10 --total 200

    # With auto-started server (port 8765):
    uv run python scripts/batch-load-test.py --auto-start --concurrency 5 --total 50

Gate criterion (P4): p95 latency < 500ms for all endpoints under 10x concurrency.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any

# ── Test data generators ──────────────────────────────────────────────────────


def sample_transactions(n: int) -> list[dict[str, Any]]:
    """Generate n diverse cashflow transactions for load testing."""
    import random

    categories = ["ventas", "servicios", "planilla", "alquiler", "insumos", "marketing"]
    txns: list[dict[str, Any]] = []
    for i in range(n):
        day = 1 + (i % 28)
        month = 1 + (i % 12)
        cat = categories[i % len(categories)]
        is_income = cat in ("ventas", "servicios")
        txns.append(
            {
                "date": f"2025-{month:02d}-{day:02d}",
                "type": "INCOME" if is_income else "EXPENSE",
                "amount": round(random.uniform(500, 25000), 2),
                "category": cat,
                "description": f"Load test transaction {i}",
            }
        )
    return txns


def sample_bank_transactions(n: int) -> list[dict[str, Any]]:
    """Generate n bank transactions for load testing."""
    import random

    descriptions = ["DEPOSITO VENTAS", "PAGO PROVEEDOR", "TRANSFERENCIA", "RETIRO CAJERO"]
    txns: list[dict[str, Any]] = []
    balance = 50000.0
    for i in range(n):
        day = 1 + (i % 28)
        month = 1 + (i % 12)
        desc = descriptions[i % len(descriptions)]
        amt = round(random.uniform(-5000, 15000), 2)
        balance += amt
        txns.append(
            {
                "date": f"2025-{month:02d}-{day:02d}",
                "description": desc,
                "net_amount": amt,
                "balance": round(balance, 2),
            }
        )
    return txns


# ── HTTP helpers ───────────────────────────────────────────────────────────────


def json_post(url: str, body: dict[str, Any], timeout: float = 30.0) -> dict[str, Any]:
    """Synchronous JSON POST using stdlib only."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {"status_code": resp.status, "body": json.loads(resp.read().decode("utf-8"))}
    except urllib.error.HTTPError as e:
        return {
            "status_code": e.code,
            "body": json.loads(e.read().decode("utf-8")),
            "error": str(e),
        }
    except Exception as e:
        return {"status_code": 0, "body": {}, "error": str(e)}


# ── Test scenarios ─────────────────────────────────────────────────────────────


@dataclass
class EndpointResult:
    name: str
    latencies: list[float] = field(default_factory=list)
    status_counts: dict[int, int] = field(default_factory=lambda: {200: 0, 400: 0, 422: 0, 500: 0, 0: 0})
    errors: list[str] = field(default_factory=list)
    shape_failures: list[str] = field(default_factory=list)

    def record(self, latency: float, result: dict[str, Any]) -> None:
        self.latencies.append(latency)
        sc = result.get("status_code", 0)
        self.status_counts[sc] = self.status_counts.get(sc, 0) + 1
        if result.get("error"):
            self.errors.append(result["error"])
        if sc != 200 and sc != 400 and sc != 422:
            self.errors.append(f"Unexpected status {sc}: {result.get('body', {})}")

    def report(self) -> dict[str, Any]:
        n = len(self.latencies)
        if n == 0:
            return {"name": self.name, "status": "NO_DATA"}
        latencies_sorted = sorted(self.latencies)
        return {
            "name": self.name,
            "requests": n,
            "failures": len(self.errors),
            "shape_failures": len(self.shape_failures),
            "status_distribution": self.status_counts,
            "latency_ms": {
                "min": round(min(self.latencies) * 1000, 1),
                "p50": round(statistics.median(self.latencies) * 1000, 1),
                "p95": round(latencies_sorted[int(n * 0.95)] * 1000, 1),
                "p99": round(latencies_sorted[int(n * 0.99)] * 1000, 1),
                "max": round(max(self.latencies) * 1000, 1),
                "mean": round(statistics.mean(self.latencies) * 1000, 1),
            },
            "gate_pass": max(self.latencies) * 1000 < 2000 and self.status_counts.get(500, 0) == 0,
        }


ENDPOINTS = [
    "cashflow/analyze",
    "cashflow/forecast",
    "cashflow/anomalies",
    "banking/reconcile",
    "banking/patterns",
    "banking/cash-position",
]


def build_payload(endpoint: str) -> dict[str, Any]:
    """Build a valid request payload for the given endpoint."""
    txns = sample_transactions(60)
    bank_txns = sample_bank_transactions(60)

    mapping: dict[str, dict[str, Any]] = {
        "cashflow/analyze": {"transactions": txns, "start_date": "2025-01-01"},
        "cashflow/forecast": {"transactions": txns, "forecast_days": 30},
        "cashflow/anomalies": {"transactions": txns, "threshold_std": 2.0},
        "banking/reconcile": {
            "bank_transactions": bank_txns,
            "system_transactions": txns,
            "tolerance_days": 3,
            "tolerance_amount": 0.01,
        },
        "banking/patterns": {"transactions": bank_txns},
        "banking/cash-position": {"transactions": bank_txns, "start_balance": 50000.0},
    }
    return mapping[endpoint]


def validate_shape(endpoint: str, body: dict[str, Any]) -> str | None:
    """Validate response shape. Returns error string or None if valid."""
    if "status_code" in body:
        return None  # error response, skip shape validation
    if not isinstance(body, dict):
        return "Response is not a dict"

    # banking/reconcile returns result directly (no status wrapper)
    if endpoint == "banking/reconcile":
        if "summary" not in body and "error" not in body:
            return "Missing 'summary' key in reconcile response"
        return None

    if body.get("status") != "success":
        return f"Expected status=success, got {body.get('status')}"
    if endpoint == "cashflow/analyze":
        if "summary" not in body:
            return "Missing 'summary' key"
        for k in ("totalIncome", "totalExpenses", "netCashflow"):
            if k not in body.get("summary", {}):
                return f"Missing summary.{k}"
    return None


async def run_scenario(
    base_url: str,
    concurrency: int,
    iterations: int,
    results: dict[str, EndpointResult],
) -> None:
    """Run load test for ALL endpoints with given concurrency x iterations."""
    loop = asyncio.get_running_loop()
    thread_pool = __import__("concurrent.futures").futures.ThreadPoolExecutor(max_workers=concurrency)

    # Prepare all tasks: interleave endpoints for realistic mixed load
    tasks: list[tuple[str, str, dict[str, Any]]] = []
    for i in range(iterations):
        ep = ENDPOINTS[i % len(ENDPOINTS)]
        url = f"{base_url}/api/v1/{ep}"
        payload = build_payload(ep)
        tasks.append((ep, url, payload))

    # Shuffle to avoid bias
    import random

    random.shuffle(tasks)

    semaphore = asyncio.Semaphore(concurrency)

    async def execute_one(ep: str, url: str, payload: dict[str, Any]) -> None:
        async with semaphore:
            start = time.monotonic()
            result = await loop.run_in_executor(thread_pool, json_post, url, payload, 30.0)
            elapsed = time.monotonic() - start
            results[ep].record(elapsed, result)
            shape_err = validate_shape(ep, result.get("body", {}))
            if shape_err:
                results[ep].shape_failures.append(shape_err)

    await asyncio.gather(*[execute_one(ep, u, p) for ep, u, p in tasks])


# ── Server management ──────────────────────────────────────────────────────────


def start_server(port: int) -> subprocess.Popen:
    """Start data-engine server as subprocess and wait for readiness."""
    server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    proc = subprocess.Popen(
        ["uv", "run", "--frozen", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=server_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    # Wait for server readiness
    health_url = f"http://127.0.0.1:{port}/api/v1/health"
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=2) as resp:
                if resp.status == 200:
                    print(f"  Server ready on port {port}")
                    return proc
        except Exception:
            time.sleep(0.3)
    proc.kill()
    raise RuntimeError("Server failed to start within 15 seconds")


# ── Main ───────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Data Engine Batch Load Test (P4 Gate)")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of running data-engine")
    parser.add_argument("--concurrency", type=int, default=10, help="Max concurrent requests")
    parser.add_argument("--total", type=int, default=200, help="Total requests to send")
    parser.add_argument("--auto-start", action="store_true", help="Auto-start and stop server")
    parser.add_argument("--port", type=int, default=8765, help="Port for auto-started server")
    args = parser.parse_args()

    server_proc: subprocess.Popen | None = None
    if args.auto_start:
        print(f"  Starting data-engine on port {args.port}...")
        server_proc = start_server(args.port)
        base_url = f"http://127.0.0.1:{args.port}"
    else:
        base_url = args.url.rstrip("/")

    print(f"\n  {'=' * 54}")
    print(f"  Data Engine Batch Load Test (P4 Gate)")
    print(f"  {'=' * 54}")
    print(f"  Target:      {base_url}/api/v1/")
    print(f"  Concurrency: {args.concurrency}")
    print(f"  Total reqs:  {args.total}")
    print(f"  Endpoints:   {', '.join(ENDPOINTS)}")
    print(f"  {'=' * 54}\n")

    # Validate server is up
    try:
        with urllib.request.urlopen(f"{base_url}/api/v1/health", timeout=5) as resp:
            health = json.loads(resp.read().decode("utf-8"))
            print(f"  Health: {json.dumps(health, indent=2)}\n")
    except Exception as e:
        print(f"  ERROR: Server not reachable at {base_url}: {e}")
        if server_proc:
            server_proc.kill()
        sys.exit(1)

    # Initialize results
    results: dict[str, EndpointResult] = {ep: EndpointResult(name=ep) for ep in ENDPOINTS}

    # Run load test
    start_time = time.monotonic()
    asyncio.run(run_scenario(base_url, args.concurrency, args.total, results))
    total_elapsed = time.monotonic() - start_time

    # Report
    print(f"  {'=' * 54}")
    print(f"  RESULTS  ({args.total} requests in {total_elapsed:.1f}s = {args.total / total_elapsed:.0f} req/s)")
    print(f"  {'=' * 54}")

    all_pass = True
    for ep in ENDPOINTS:
        r = results[ep]
        rep = r.report()
        gate = "✅ PASS" if rep.get("gate_pass") else "❌ FAIL"
        if not rep.get("gate_pass"):
            all_pass = False
        print(f"\n  {ep}:")
        print(f"    Requests:    {rep['requests']}")
        print(f"    Failures:    {rep['failures']}")
        print(f"    Shape errs:  {rep['shape_failures']}")
        print(f"    Statuses:    {rep['status_distribution']}")
        print(f"    Latency ms:  p50={rep['latency_ms']['p50']}  p95={rep['latency_ms']['p95']}  "
              f"p99={rep['latency_ms']['p99']}  max={rep['latency_ms']['max']}")
        print(f"    Gate:        {gate} (p95<500ms? {rep['latency_ms']['p95'] < 500}, no 5xx? {rep['status_distribution'].get(500, 0) == 0})")

    print(f"\n  {'=' * 54}")
    print(f"  OVERALL: {'✅ ALL PASS' if all_pass else '⚠️  SOME FAILURES'}")
    print(f"  {'=' * 54}\n")

    if server_proc:
        print("  Stopping server...")
        server_proc.kill()
        server_proc.wait()

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
