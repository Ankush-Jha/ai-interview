/**
 * Code Sandbox
 * 
 * Executes untrusted user code in a restricted environment.
 * Uses Node.js vm module with strict timeouts and resource limits.
 * 
 * NOTE: For production, consider upgrading to isolated-vm for
 * stronger isolation. The vm module prevents casual abuse but is
 * not a full security boundary against determined attackers.
 * 
 * Currently supports JavaScript execution only.
 * Python support would require a separate sandboxed process.
 */
import vm from 'node:vm'

const TIMEOUT_MS = parseInt(process.env.SANDBOX_TIMEOUT_MS || '5000')

/**
 * Execute JavaScript code against test cases.
 * @param {string} code - User's code string
 * @param {Array<{input: string, expected: string, description: string}>} testCases
 * @param {string} functionName - The function to test
 * @returns {Array<{passed: boolean, input: string, expected: any, actual: any, error?: string, description: string}>}
 */
export function executeJavaScript(code, testCases, functionName) {
    const results = []

    for (const tc of testCases) {
        try {
            // Create a fresh sandbox for each test case
            const sandbox = {
                console: { log: () => { }, error: () => { }, warn: () => { } },
                result: undefined,
                error: undefined,
            }

            const context = vm.createContext(sandbox)

            // Step 1: Define the user's function
            vm.runInContext(code, context, {
                timeout: TIMEOUT_MS,
                displayErrors: false,
            })

            // Step 2: Call the function with test input
            const callCode = `
                try {
                    result = ${functionName}(${tc.input});
                } catch (e) {
                    error = e.message;
                }
            `
            vm.runInContext(callCode, context, {
                timeout: TIMEOUT_MS,
                displayErrors: false,
            })

            if (sandbox.error) {
                results.push({
                    passed: false,
                    input: tc.input,
                    expected: tc.expected,
                    actual: `Error: ${sandbox.error}`,
                    error: sandbox.error,
                    description: tc.description || '',
                })
                continue
            }

            // Compare results (stringify for deep equality)
            const actualStr = JSON.stringify(sandbox.result)
            const expectedStr = JSON.stringify(eval(`(${tc.expected})`))
            const passed = actualStr === expectedStr

            results.push({
                passed,
                input: tc.input,
                expected: tc.expected,
                actual: sandbox.result,
                description: tc.description || '',
            })

        } catch (err) {
            results.push({
                passed: false,
                input: tc.input,
                expected: tc.expected,
                actual: null,
                error: err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT'
                    ? `Timeout: Code took more than ${TIMEOUT_MS}ms`
                    : err.message,
                description: tc.description || '',
            })
        }
    }

    return results
}

/**
 * Execute Python code via test cases.
 * For now, returns a placeholder — Python execution requires
 * a subprocess sandbox (e.g., Docker, Pyodide, or child_process).
 */
export function executePython(code, testCases, functionName) {
    // TODO: Implement Python sandbox via child_process or Docker
    return testCases.map(tc => ({
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: null,
        error: 'Python execution is not yet supported on the server. Run locally.',
        description: tc.description || '',
    }))
}

/**
 * Execute code and return test results.
 * @param {string} code
 * @param {Array} testCases
 * @param {string} functionName
 * @param {string} language - 'javascript' | 'python'
 */
export function executeCode(code, testCases, functionName, language = 'javascript') {
    switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
            return executeJavaScript(code, testCases, functionName)
        case 'python':
        case 'py':
            return executePython(code, testCases, functionName)
        default:
            return testCases.map(tc => ({
                passed: false,
                input: tc.input,
                expected: tc.expected,
                actual: null,
                error: `Unsupported language: ${language}`,
                description: tc.description || '',
            }))
    }
}
