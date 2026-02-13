/**
 * Sandboxed code execution for interview coding questions.
 * Runs JavaScript in a Web Worker, with timeout protection.
 */

// ─── JavaScript Execution via Web Worker ─────────────────────────────────────

function createWorkerBlob(code, testCases, fnName) {
    const workerCode = `
        // Block dangerous globals
        self.fetch = undefined;
        self.XMLHttpRequest = undefined;
        self.importScripts = undefined;
        self.WebSocket = undefined;

        try {
            // Execute user code to define the function
            ${code}

            // Run test cases
            const results = [];
            const testCases = ${JSON.stringify(testCases)};

            for (const tc of testCases) {
                try {
                    // Parse inputs
                    const args = JSON.parse('[' + tc.input + ']');
                    const expected = JSON.parse(tc.expected);

                    // Call the function
                    const actual = ${fnName}(...args);

                    // Compare
                    const pass = JSON.stringify(actual) === JSON.stringify(expected);
                    results.push({
                        input: tc.input,
                        expected: tc.expected,
                        actual: JSON.stringify(actual),
                        pass,
                        description: tc.description || ''
                    });
                } catch (err) {
                    results.push({
                        input: tc.input,
                        expected: tc.expected,
                        actual: 'Error: ' + err.message,
                        pass: false,
                        description: tc.description || ''
                    });
                }
            }

            self.postMessage({ success: true, results });
        } catch (err) {
            self.postMessage({ success: false, error: err.message });
        }
    `;
    return new Blob([workerCode], { type: "application/javascript" });
}

/**
 * Run JavaScript code against test cases in a sandboxed Web Worker.
 * @param {string} code - User's JavaScript code
 * @param {Array} testCases - [{input, expected, description}]
 * @param {string} fnName - Name of the function to test
 * @param {number} timeout - Max execution time in ms (default 10s)
 * @returns {Promise<{passed, failed, total, results, error}>}
 */
export function runJavaScript(code, testCases, fnName, timeout = 10000) {
    return new Promise((resolve) => {
        const blob = createWorkerBlob(code, testCases, fnName);
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        const timer = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: testCases.map((tc) => ({
                    ...tc,
                    actual: "Timeout — code took too long (possible infinite loop)",
                    pass: false,
                })),
                error: "Execution timed out after 10 seconds",
            });
        }, timeout);

        worker.onmessage = (e) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);

            if (e.data.success) {
                const results = e.data.results;
                const passed = results.filter((r) => r.pass).length;
                resolve({
                    passed,
                    failed: results.length - passed,
                    total: results.length,
                    results,
                    error: null,
                });
            } else {
                resolve({
                    passed: 0,
                    failed: testCases.length,
                    total: testCases.length,
                    results: [],
                    error: e.data.error,
                });
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: [],
                error: err.message || "Worker execution error",
            });
        };
    });
}

// ─── Python Execution via Pyodide in a Web Worker ────────────────────────────

function createPythonWorkerBlob(code, testCases, fnName) {
    const workerCode = `
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js");

        async function run() {
            try {
                const pyodide = await loadPyodide();
                const results = [];
                const testCases = ${JSON.stringify(testCases)};
                const expectedFnName = ${JSON.stringify(fnName)};
                const userCode = ${JSON.stringify(code)};

                // Step 1: Run user code to define functions
                pyodide.runPython(userCode);

                // Step 2: Find the actual function name
                // Try: exact name, snake_case version, user-defined functions
                function toSnakeCase(name) {
                    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
                }
                function toCamelCase(name) {
                    return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
                }

                // Extract all function names from user code
                const defMatches = userCode.match(/def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/g) || [];
                const userFns = defMatches.map(m => m.replace(/def\\s+/, '').replace(/\\s*\\(/, ''));

                // Build candidate list: exact name, snake_case, camelCase, user-defined functions
                const candidates = [
                    expectedFnName,
                    toSnakeCase(expectedFnName),
                    toCamelCase(expectedFnName),
                    expectedFnName.toLowerCase(),
                    ...userFns
                ];

                // Find which one actually exists in Python
                let actualFn = null;
                for (const name of candidates) {
                    try {
                        const exists = pyodide.runPython("callable(" + name + ")");
                        if (exists) { actualFn = name; break; }
                    } catch(e) { /* not defined, try next */ }
                }

                if (!actualFn) {
                    self.postMessage({
                        success: false,
                        error: "Could not find function '" + expectedFnName + "'. " +
                               "Tried: " + candidates.filter((v,i,a) => a.indexOf(v) === i).join(", ") + ". " +
                               "Make sure your function name matches."
                    });
                    return;
                }

                // Step 3: Run test cases
                for (const tc of testCases) {
                    try {
                        // Smart input parsing: detect if input looks like a single value
                        // (dict, list, string) or multiple comma-separated args
                        const inputStr = tc.input.trim();
                        let callExpr;

                        // If input looks like a single dict/list/string, pass directly
                        if (inputStr.startsWith('{') || inputStr.startsWith('[') || inputStr.startsWith('"') || inputStr.startsWith("'")) {
                            callExpr = actualFn + "(" + inputStr + ")";
                        } else {
                            // Multiple args or simple values — pass as-is
                            callExpr = actualFn + "(" + inputStr + ")";
                        }

                        const resultScript = "import json\\n" +
                            "_result = " + callExpr + "\\n" +
                            "str(round(_result, 2) if isinstance(_result, float) else _result)";

                        const actual = pyodide.runPython(resultScript);
                        const expected = tc.expected.trim();
                        const actualClean = String(actual).trim().replace(/^['"]|['"]$/g, "");
                        const expectedClean = expected.replace(/^['"]|['"]$/g, "");

                        results.push({
                            input: tc.input,
                            expected: tc.expected,
                            actual: actualClean,
                            pass: actualClean === expectedClean,
                            description: tc.description || ""
                        });
                    } catch (err) {
                        results.push({
                            input: tc.input,
                            expected: tc.expected,
                            actual: "Error: " + (err.message || String(err)),
                            pass: false,
                            description: tc.description || ""
                        });
                    }
                }

                self.postMessage({ success: true, results });
            } catch (err) {
                self.postMessage({ success: false, error: "Pyodide error: " + (err.message || String(err)) });
            }
        }

        run();
    `;
    return new Blob([workerCode], { type: "application/javascript" });
}

/**
 * Run Python code against test cases using Pyodide in a Web Worker.
 */
export function runPython(code, testCases, fnName, timeout = 30000) {
    return new Promise((resolve) => {
        const blob = createPythonWorkerBlob(code, testCases, fnName);
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        const timer = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: testCases.map((tc) => ({
                    ...tc,
                    actual: "Timeout — Pyodide took too long to load or execute",
                    pass: false,
                })),
                error: "Execution timed out (Pyodide may still be loading — try again)",
            });
        }, timeout);

        worker.onmessage = (e) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);

            if (e.data.success) {
                const results = e.data.results;
                const passed = results.filter((r) => r.pass).length;
                resolve({
                    passed,
                    failed: results.length - passed,
                    total: results.length,
                    results,
                    error: null,
                });
            } else {
                resolve({
                    passed: 0,
                    failed: testCases.length,
                    total: testCases.length,
                    results: [],
                    error: e.data.error,
                });
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                passed: 0,
                failed: testCases.length,
                total: testCases.length,
                results: [],
                error: err.message || "Python worker execution error",
            });
        };
    });
}

// ─── Unified Runner ──────────────────────────────────────────────────────────

/**
 * Run code against test cases (auto-detects language).
 */
export async function runTests(code, language, testCases, fnName) {
    const lang = (language || "javascript").toLowerCase();

    if (lang === "python" || lang === "py") {
        return runPython(code, testCases, fnName);
    }

    // Default to JavaScript
    return runJavaScript(code, testCases, fnName);
}
