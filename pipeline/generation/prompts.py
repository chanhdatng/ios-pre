"""Prompt templates for flashcard generation."""

FLASHCARD_SYSTEM_PROMPT = """You are an expert iOS developer creating interview flashcards for Senior-level positions (5+ years experience).

RULES:
1. Questions should test deep understanding, not memorization
2. Answers should be concise but comprehensive
3. Include practical examples where relevant
4. Focus on concepts asked in real iOS interviews
5. Output valid JSON only

OUTPUT FORMAT:
{
  "front": "Question (max 200 chars)",
  "back": "Answer (max 500 chars)",
  "tags": ["tag1", "tag2"],
  "swift_version": "5.5+" or null,
  "confidence": 0.0-1.0
}"""

FLASHCARD_USER_PROMPT = """Create a Senior iOS interview flashcard about: {topic}

CONTEXT FROM DOCUMENTATION:
{context}

REQUIREMENTS:
- Question should test deep understanding
- Answer should be what a Senior dev would say in interview
- Include Swift version if feature is version-specific
- Confidence = how sure you are this is accurate (0.0-1.0)

Output JSON only, no explanation."""

CODE_EXAMPLE_PROMPT = """Generate a minimal, compilable Swift code example demonstrating:

Topic: {topic}
Concept: {concept}

REQUIREMENTS:
1. Must compile with Swift 5.9+
2. Self-contained (no external dependencies)
3. Under 20 lines
4. Include brief comment explaining key point
5. Use modern Swift syntax

Output code only, no explanation."""

CODE_VERIFY_PROMPT = """Review this Swift code for correctness and modern practices:

```swift
{code}
```

CHECKS:
1. Will it compile with Swift 5.9+?
2. Uses modern syntax (no deprecated APIs)?
3. Demonstrates the concept correctly?

Output JSON only:
{{
  "compiles": true/false,
  "modern": true/false,
  "correct": true/false,
  "issues": ["issue1", "issue2"] or [],
  "fixed_code": "corrected code if needed" or null
}}"""

# Senior iOS interview topics for generation
SENIOR_IOS_TOPICS = {
    "swift": [
        "Advanced Generics and Type Erasure",
        "Property Wrappers implementation",
        "Result Builders",
        "Swift Macros",
        "Memory Management and ARC internals",
        "Copy-on-Write optimization",
        "Opaque types (some vs any)",
    ],
    "concurrency": [
        "Structured Concurrency",
        "Actors and Actor isolation",
        "Sendable protocol",
        "Task Groups",
        "AsyncSequence and AsyncStream",
        "MainActor and global actors",
        "Data race prevention",
    ],
    "swiftui": [
        "View lifecycle and identity",
        "State management patterns",
        "@Observable vs ObservableObject",
        "Custom ViewModifiers",
        "Preference Keys",
        "Layout protocol",
        "Animation internals",
    ],
    "architecture": [
        "Clean Architecture in iOS",
        "MVVM vs MVC vs VIPER",
        "The Composable Architecture",
        "Dependency Injection patterns",
        "Modularization strategies",
        "Protocol-oriented design",
    ],
    "testing": [
        "Unit testing best practices",
        "UI Testing strategies",
        "Snapshot testing",
        "Test doubles patterns",
        "Async testing",
    ],
    "performance": [
        "Instruments profiling",
        "Memory optimization",
        "Launch time optimization",
        "Battery efficiency",
        "Network optimization",
    ],
}
