"""Claude API client wrapper."""

from anthropic import AsyncAnthropic

from ..config import get_settings
from ..utils.logging import get_logger

logger = get_logger(__name__)


class ClaudeClient:
    """Async wrapper for Claude API."""

    def __init__(self):
        settings = get_settings()
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model
        self.max_tokens = settings.max_tokens

    async def generate(
        self,
        prompt: str,
        system: str = "",
        max_tokens: int | None = None,
    ) -> str:
        """Generate text completion from Claude.

        Args:
            prompt: User message
            system: System prompt
            max_tokens: Override default max tokens

        Returns:
            Generated text response
        """
        logger.debug(f"Generating with Claude: {prompt[:100]}...")

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens or self.max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        logger.debug(f"Claude response: {len(text)} chars")
        return text

    async def generate_json(
        self,
        prompt: str,
        system: str = "",
    ) -> str:
        """Generate JSON response from Claude.

        Args:
            prompt: User message requesting JSON output
            system: System prompt

        Returns:
            JSON string response
        """
        json_system = f"{system}\n\nRespond with valid JSON only, no markdown."
        return await self.generate(prompt, json_system)
