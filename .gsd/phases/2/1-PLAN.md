# Plan 2.1: Curated DSA Problem Bank

## Objective
Create a local, open-source DSA problem bank with curated test cases that can supplement or replace AI-generated coding questions. This solves REQ-11.

## Context
@file src/lib/code-runner.js (test harness, supports JS/Python/Java/C++)
@file src/components/CodeEditor.jsx (expects: question, starterCode, testCases, functionName, hints, difficulty, topic)
@file server/lib/prompts.js (AI generates coding questions + test cases from PDF — but quality is inconsistent)

## Why
AI-generated test cases from HuggingFace are unreliable — sometimes the function name doesn't match, test inputs are malformed, or edge cases are missing. A curated bank with verified test cases ensures a reliable coding experience.

## Tasks

### Task 1: Create DSA problem data file
Create `src/data/dsa-problems.js` with 30+ curated problems across 6 categories:
- Arrays & Strings (5 problems)
- Linked Lists (5)
- Trees & Graphs (5)
- Dynamic Programming (5)
- Sorting & Searching (5)
- Stacks & Queues (5)

Each problem must have:
```js
{
  id: 'two-sum',
  title: 'Two Sum',
  topic: 'arrays',
  difficulty: 'easy',    // easy | medium | hard
  type: 'coding',
  mode: 'coding',
  question: 'Given an array of integers...',  // Full problem statement
  functionName: 'twoSum',
  starterCode: 'function twoSum(nums, target) {\n  // Write your solution\n}',
  testCases: [
    { input: '[2,7,11,15], 9', expected: '[0,1]', description: 'Basic case' },
    { input: '[3,2,4], 6', expected: '[1,2]', description: 'Duplicate values' },
    { input: '[3,3], 6', expected: '[0,1]', description: 'Same element' },
  ],
  hints: ['Think about using a hash map', 'One pass is enough'],
  tags: ['hash-map', 'array'],
}
```

### Task 2: Question generation integration
Modify `src/lib/gemini.js` (or the question generation flow) to:
1. If user's PDF contains coding topics AND "coding" question type is selected → blend curated DSA problems with AI-generated ones
2. Add a `getProblemsForTopic(topic, difficulty, count)` function that filters from the problem bank
3. Ensure curated problems are used as the primary source, AI-generated as supplement

### Verification
- [ ] `dsa-problems.js` exports at least 30 problems
- [ ] Each problem has valid testCases with `input`, `expected`, `description`
- [ ] `getProblemsForTopic('arrays', 'easy', 3)` returns 3 problems
- [ ] Build passes: `npx vite build`
