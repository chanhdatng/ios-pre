"""Prompt templates for flashcard generation."""

FLASHCARD_SYSTEM_PROMPT = """You are an expert iOS developer creating comprehensive interview flashcards for Senior-level positions (5+ years experience).

RULES:
1. Questions should test deep understanding, not memorization
2. Answers MUST be detailed and thorough (800-1500 chars)
3. ALWAYS include:
   - Core concept explanation
   - Practical code example with comments
   - Common pitfalls or edge cases
   - When to use vs alternatives
4. Focus on concepts asked in real iOS interviews
5. Output valid JSON only

OUTPUT FORMAT:
{
  "front": "Question (max 250 chars)",
  "back": "Detailed answer with examples (800-1500 chars)",
  "tags": ["tag1", "tag2"],
  "swift_version": "5.5+" or null,
  "confidence": 0.0-1.0
}"""

FLASHCARD_USER_PROMPT = """Create a comprehensive Senior iOS interview flashcard about: {topic}

CONTEXT FROM DOCUMENTATION:
{context}

REQUIREMENTS:
- Question should test deep understanding (not simple recall)
- Answer MUST be detailed (800-1500 chars) and include:
  * Clear explanation of the concept
  * Code example demonstrating usage
  * Common mistakes to avoid
  * Comparison with alternatives if applicable
- Write as a Senior dev would explain in an interview
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
    "networking": [
        "URLSession advanced usage",
        "HTTP/2 and HTTP/3",
        "REST vs GraphQL",
        "WebSocket implementation",
        "Certificate pinning",
        "Background transfers",
        "Network layer architecture",
    ],
    "data_persistence": [
        "Core Data stack and contexts",
        "SwiftData fundamentals",
        "Core Data vs SwiftData",
        "Migration strategies",
        "Concurrency with Core Data",
        "Caching strategies",
        "Keychain usage",
    ],
    "combine": [
        "Publishers and Subscribers",
        "Operators (map, flatMap, combineLatest)",
        "Error handling in Combine",
        "Combine vs async/await",
        "Custom Publishers",
        "Memory management in Combine",
        "Debugging Combine pipelines",
    ],
    "uikit": [
        "UIViewController lifecycle",
        "AutoLayout programmatic",
        "UICollectionView compositional layout",
        "Diffable data sources",
        "UIKit and SwiftUI interop",
        "Custom transitions",
        "Responder chain",
    ],
    "security": [
        "Keychain Services",
        "App Transport Security",
        "Biometric authentication",
        "Data encryption",
        "Code signing and provisioning",
        "Secure coding practices",
        "OWASP mobile security",
    ],
    "debugging": [
        "LLDB commands",
        "Memory debugging",
        "Crash log analysis",
        "Symbolication",
        "Network debugging",
        "View debugging",
        "Performance profiling",
    ],
}
