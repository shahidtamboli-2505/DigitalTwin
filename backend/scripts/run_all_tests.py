import subprocess
import sys
import os

TEST_SCRIPTS = [
    "backend/scripts/test_db.py",
    "backend/scripts/test_auth.py",
    "backend/scripts/test_crud.py",
    "backend/scripts/test_flood_ai.py",
    "backend/scripts/test_crack_ai.py",
    "backend/scripts/test_risk_engine.py",
    "backend/scripts/test_sensors_api.py",
    "backend/scripts/test_alerts_api.py",
    "backend/scripts/test_report_ai.py",
]

def main():
    print("================================================================")
    print(" SANGLI DIGITAL TWIN -- FULL SYSTEM VERIFICATION TEST SUITE")
    print("================================================================\n")
    
    python_exe = sys.executable
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    passed = 0
    failed = 0

    for script in TEST_SCRIPTS:
        print(f"Executing: {script}...")
        res = subprocess.run([python_exe, script], capture_output=True, env=env)
        if res.returncode == 0:
            print(f"  [PASSED] {script}")
            passed += 1
        else:
            print(f"  [FAILED] {script}")
            print("  Error output:\n", res.stderr.decode('utf-8', errors='ignore'))
            failed += 1

    print("\n================================================================")
    print(f" SUMMARY: {passed} PASSED, {failed} FAILED (Total: {len(TEST_SCRIPTS)})")
    print("================================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
