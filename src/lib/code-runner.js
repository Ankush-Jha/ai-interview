/**
 * Code execution engine for interview coding questions.
 * - JavaScript: runs locally in a Web Worker (instant)
 * - Python / Java / C++: runs remotely via Piston API (free, no key)
 */

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

// ─── Language config ─────────────────────────────────────────────────────────

const LANG_CONFIG = {
    javascript: { piston: "javascript", version: "18.15.0", runtime: "node", ext: "js" },
    python: { piston: "python", version: "3.10.0", ext: "py" },
    java: { piston: "java", version: "15.0.2", ext: "java" },
    "c++": { piston: "c++", version: "10.2.0", ext: "cpp" },
    cpp: { piston: "c++", version: "10.2.0", ext: "cpp" },
};

// ─── Piston API call ─────────────────────────────────────────────────────────

async function callPiston(code, language, stdin = "") {
    const config = LANG_CONFIG[language.toLowerCase()] || LANG_CONFIG.python;

    const body = {
        language: config.piston,
        version: config.version,
        files: [{ name: `main.${config.ext}`, content: code }],
        stdin,
        compile_timeout: 10000,
        run_timeout: 10000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
    };

    if (config.runtime) body.runtime = config.runtime;

    const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Piston API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    const run = data.run || {};

    return {
        stdout: run.stdout || "",
        stderr: run.stderr || "",
        exitCode: run.code ?? -1,
        error: run.signal ? `Process killed by signal: ${run.signal}` : null,
    };
}

// ─── Test harness builders ───────────────────────────────────────────────────

function buildPythonHarness(userCode, testCases, fnName) {
    const tcJson = JSON.stringify(testCases);
    return `
${userCode}

# ─── Test runner (auto-generated) ───
import json as _json, sys as _sys

def _to_snake(name):
    import re
    s = re.sub(r'([A-Z])', r'_\\1', name).lower().lstrip('_')
    return s

# Find the function
_fn = None
_candidates = ["${fnName}", _to_snake("${fnName}"), "${fnName}".lower()]
for _name in _candidates:
    if _name in dir() and callable(eval(_name)):
        _fn = eval(_name)
        break

if not _fn:
    # Try to find any user-defined function
    import types as _types
    _user_fns = [v for k, v in list(globals().items()) if isinstance(v, _types.FunctionType) and not k.startswith('_')]
    if _user_fns:
        _fn = _user_fns[-1]

if not _fn:
    print(_json.dumps({"error": f"Function '{_candidates[0]}' not found. Define a function matching the expected name."}))
    _sys.exit(0)

_tests = _json.loads('${tcJson.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')
_results = []

for _tc in _tests:
    try:
        _input_str = _tc["input"].strip()
        _input_val = eval(_input_str)
        if isinstance(_input_val, tuple):
            _out = _fn(*_input_val)
        else:
            _out = _fn(_input_val)
        _expected_val = eval(_tc["expected"].strip())
        if isinstance(_out, float):
            _out = round(_out, 2)
        if isinstance(_expected_val, float):
            _expected_val = round(_expected_val, 2)
        _pass = _out == _expected_val
        _results.append({"pass": _pass, "actual": str(_out), "expected": str(_expected_val), "input": _tc["input"], "description": _tc.get("description", "")})
    except Exception as _e:
        _results.append({"pass": False, "actual": f"Error: {_e}", "expected": _tc["expected"], "input": _tc["input"], "description": _tc.get("description", "")})

print(_json.dumps(_results))
`;
}

function buildJavaScriptHarness(userCode, testCases, fnName) {
    const tcJson = JSON.stringify(testCases);
    return `
${userCode}

// ─── Test runner (auto-generated) ───
const _tests = ${tcJson};
const _results = [];

// Find the function
let _fn;
try { _fn = eval("${fnName}"); } catch(e) {}
if (!_fn) try { _fn = eval("${fnName.charAt(0).toLowerCase() + fnName.slice(1)}"); } catch(e) {}
if (!_fn) try { _fn = eval("${fnName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}"); } catch(e) {}

if (typeof _fn !== "function") {
    console.log(JSON.stringify({error: "Function '${fnName}' not found. Define a function matching the expected name."}));
    process.exit(0);
}

for (const _tc of _tests) {
    try {
        const _input = eval(_tc.input);
        let _out;
        if (Array.isArray(_input) && _tc.input.trim().startsWith("[") && _tc.input.includes(",")) {
            _out = _fn(..._input);
        } else {
            _out = _fn(_input);
        }
        const _expected = eval(_tc.expected);
        const _pass = JSON.stringify(_out) === JSON.stringify(_expected) ||
                       (typeof _out === "number" && typeof _expected === "number" &&
                        Math.abs(_out - _expected) < 0.01);
        _results.push({pass: _pass, actual: String(_out), expected: String(_expected), input: _tc.input, description: _tc.description || ""});
    } catch(e) {
        _results.push({pass: false, actual: "Error: " + e.message, expected: _tc.expected, input: _tc.input, description: _tc.description || ""});
    }
}
console.log(JSON.stringify(_results));
`;
}

function buildJavaHarness(userCode, testCases, fnName) {
    // For Java, we wrap test execution with a main method
    const tcInputs = testCases.map(tc => tc.input).join('","');
    const tcExpected = testCases.map(tc => tc.expected).join('","');
    const tcDescs = testCases.map(tc => (tc.description || "")).join('","');

    return `
import java.util.*;
import java.util.stream.*;
import org.json.*;

${userCode}

// Note: Java execution relies on the user writing a complete class.
// For simplicity, we just compile and run their code as-is.
`;
}

// ─── JavaScript local execution via Web Worker ───────────────────────────────

function runJavaScriptLocal(code, testCases, fnName, timeout = 10000) {
    return new Promise((resolve) => {
        const harness = buildJavaScriptHarness(code, testCases, fnName);

        const workerCode = `
            self.fetch = undefined;
            self.XMLHttpRequest = undefined;
            self.WebSocket = undefined;

            // Capture console.log output
            let _output = "";
            const _origLog = console.log;
            console.log = (...args) => { _output += args.join(" ") + "\\n"; };

            try {
                ${harness}
                self.postMessage({ success: true, output: _output });
            } catch (err) {
                self.postMessage({ success: false, error: err.message });
            }
        `;

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        const timer = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: testCases.map(tc => ({
                    ...tc, actual: "Timeout — possible infinite loop", pass: false,
                })),
                error: "Execution timed out after 10 seconds",
            });
        }, timeout);

        worker.onmessage = (e) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);

            if (e.data.success) {
                try {
                    const parsed = JSON.parse(e.data.output.trim());
                    if (parsed.error) {
                        resolve({ passed: 0, failed: testCases.length, total: testCases.length, results: [], error: parsed.error });
                        return;
                    }
                    const passed = parsed.filter(r => r.pass).length;
                    resolve({ passed, failed: parsed.length - passed, total: parsed.length, results: parsed, error: null });
                } catch {
                    resolve({ passed: 0, failed: testCases.length, total: testCases.length, results: [], error: "Failed to parse test results" });
                }
            } else {
                resolve({ passed: 0, failed: testCases.length, total: testCases.length, results: [], error: e.data.error });
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({ passed: 0, failed: testCases.length, total: testCases.length, results: [], error: err.message || "Worker error" });
        };
    });
}

// ─── Remote execution via Piston API ─────────────────────────────────────────

async function runWithPiston(code, language, testCases, fnName) {
    const lang = language.toLowerCase();

    // Build the combined script (user code + test harness)
    let fullScript;
    if (lang === "python" || lang === "py") {
        fullScript = buildPythonHarness(code, testCases, fnName);
    } else if (lang === "javascript" || lang === "js") {
        fullScript = buildJavaScriptHarness(code, testCases, fnName);
    } else {
        // For Java/C++, run the code as-is and rely on stdout
        fullScript = code;
    }

    const result = await callPiston(fullScript, lang);

    // Check for compilation/runtime errors
    if (result.stderr && !result.stdout.trim()) {
        return {
            passed: 0,
            failed: testCases.length,
            total: testCases.length,
            results: testCases.map(tc => ({
                input: tc.input,
                expected: tc.expected,
                actual: `Error: ${result.stderr.slice(0, 300)}`,
                pass: false,
                description: tc.description || "",
            })),
            error: result.stderr.slice(0, 500),
        };
    }

    // Parse the JSON results from stdout
    try {
        const output = result.stdout.trim();
        const parsed = JSON.parse(output);

        // Check if it's an error message
        if (parsed.error) {
            return {
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: [],
                error: parsed.error,
            };
        }

        const passed = parsed.filter(r => r.pass).length;
        return {
            passed,
            failed: parsed.length - passed,
            total: parsed.length,
            results: parsed,
            error: null,
        };
    } catch {
        // If we can't parse JSON, return stdout/stderr as error
        return {
            passed: 0,
            failed: testCases.length,
            total: testCases.length,
            results: [],
            error: result.stdout || result.stderr || "No output from code execution",
        };
    }
}

// ─── Unified Runner ──────────────────────────────────────────────────────────

/**
 * Run code against test cases. Uses local Web Worker for JS, Piston API for everything else.
 * @param {string} code - User's source code
 * @param {string} language - Programming language
 * @param {Array} testCases - [{input, expected, description}]
 * @param {string} fnName - Expected function name
 * @returns {Promise<{passed, failed, total, results, error}>}
 */
export async function runTests(code, language, testCases, fnName) {
    const lang = (language || "python").toLowerCase();

    if (!code || !code.trim()) {
        return {
            passed: 0,
            failed: testCases.length,
            total: testCases.length,
            results: [],
            error: "No code to run. Write your solution first!",
        };
    }

    if (!testCases || testCases.length === 0) {
        return { passed: 0, failed: 0, total: 0, results: [], error: "No test cases available" };
    }

    try {
        // JavaScript runs locally for speed
        if (lang === "javascript" || lang === "js") {
            return runJavaScriptLocal(code, testCases, fnName);
        }

        // Everything else goes through Piston
        return await runWithPiston(code, lang, testCases, fnName);
    } catch (err) {
        return {
            passed: 0,
            failed: testCases.length,
            total: testCases.length,
            results: [],
            error: `Execution failed: ${err.message}`,
        };
    }
}
