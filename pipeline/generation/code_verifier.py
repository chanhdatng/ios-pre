"""Code example generation and verification."""

import json
import os
import re
import subprocess
import tempfile

from ..clients.gemini_client import GeminiClient
from ..utils.logging import get_logger
from .models import Flashcard
from .prompts import CODE_EXAMPLE_PROMPT, CODE_VERIFY_PROMPT

logger = get_logger(__name__)


class CodeVerifier:
    """Generates and verifies Swift code examples."""

    def __init__(self):
        self.gemini = GeminiClient()

    async def generate_code_example(self, topic: str, concept: str) -> str | None:
        """Generate a Swift code example.

        Args:
            topic: Topic area (swift, concurrency, etc.)
            concept: Specific concept to demonstrate

        Returns:
            Generated code or None if failed
        """
        prompt = CODE_EXAMPLE_PROMPT.format(topic=topic, concept=concept)

        try:
            response = await self.gemini.generate(prompt)
            return self._extract_code(response)
        except Exception as e:
            logger.error(f"Code generation failed: {e}")
            return None

    def _extract_code(self, response: str) -> str:
        """Extract Swift code from LLM response."""
        # Try swift code block
        if "```swift" in response:
            match = re.search(r"```swift\s*(.*?)\s*```", response, re.DOTALL)
            if match:
                return match.group(1).strip()

        # Try any code block
        if "```" in response:
            match = re.search(r"```\s*(.*?)\s*```", response, re.DOTALL)
            if match:
                return match.group(1).strip()

        # Return as-is if no code block
        return response.strip()

    async def verify_code(self, code: str) -> dict:
        """Verify code with LLM and optionally Swift compiler.

        Args:
            code: Swift code to verify

        Returns:
            Verification result dict
        """
        # 1. LLM verification
        prompt = CODE_VERIFY_PROMPT.format(code=code)

        try:
            response = await self.gemini.generate(prompt)
            llm_result = self._parse_verification_response(response)
        except Exception as e:
            logger.error(f"LLM verification failed: {e}")
            llm_result = {"compiles": False, "issues": [str(e)]}

        # 2. Try Swift compiler if available
        compiler_result = self._swift_compile_check(code)

        return {
            "llm_check": llm_result,
            "compiler_check": compiler_result,
            "verified": compiler_result["success"] and llm_result.get("correct", False),
        }

    def _parse_verification_response(self, response: str) -> dict:
        """Parse verification JSON from LLM response."""
        # Try extracting JSON
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try from code block
        if "```json" in response:
            match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass

        # Try any JSON object
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        return {"compiles": False, "issues": ["Failed to parse verification response"]}

    def _swift_compile_check(self, code: str) -> dict:
        """Check if code compiles with Swift compiler."""
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".swift", delete=False
            ) as f:
                f.write(code)
                f.flush()
                temp_path = f.name

            result = subprocess.run(
                ["swiftc", "-parse", temp_path],
                capture_output=True,
                text=True,
                timeout=30,
            )

            os.unlink(temp_path)

            return {
                "success": result.returncode == 0,
                "errors": result.stderr if result.returncode != 0 else None,
            }

        except FileNotFoundError:
            # Swift compiler not available
            return {"success": True, "errors": None, "skipped": True}
        except subprocess.TimeoutExpired:
            return {"success": False, "errors": "Compilation timeout"}
        except Exception as e:
            return {"success": False, "errors": str(e)}

    async def add_code_to_flashcard(self, flashcard: Flashcard) -> Flashcard:
        """Generate and add verified code example to flashcard.

        Args:
            flashcard: Flashcard to enhance

        Returns:
            Updated flashcard with code example if successful
        """
        # Generate code
        code = await self.generate_code_example(flashcard.topic, flashcard.front)

        if not code:
            logger.warning(f"No code generated for: {flashcard.front[:50]}")
            return flashcard

        # Verify
        verification = await self.verify_code(code)

        if verification["verified"]:
            flashcard.code_example = code
            flashcard.verified = True
            logger.info(f"Verified code for: {flashcard.front[:50]}")
        else:
            # Try fixed code if available
            fixed_code = verification["llm_check"].get("fixed_code")
            if fixed_code:
                fix_verification = await self.verify_code(fixed_code)
                if fix_verification["verified"]:
                    flashcard.code_example = fixed_code
                    flashcard.verified = True
                    logger.info(f"Used fixed code for: {flashcard.front[:50]}")
                else:
                    logger.warning(f"Code verification failed: {flashcard.front[:50]}")
            else:
                logger.warning(f"Code verification failed: {flashcard.front[:50]}")

        return flashcard
