"""Gemini API client wrapper using google-genai SDK."""

from google import genai

from ..config import get_settings
from ..utils.logging import get_logger

logger = get_logger(__name__)


class GeminiClient:
    """Wrapper for Gemini API with generation and embedding support."""

    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.gemini_model
        self.embedding_model = settings.embedding_model

    async def generate(self, prompt: str) -> str:
        """Generate text completion from Gemini.

        Args:
            prompt: Input prompt

        Returns:
            Generated text response
        """
        logger.debug(f"Generating with Gemini: {prompt[:100]}...")

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        text = response.text
        logger.debug(f"Gemini response: {len(text)} chars")
        return text

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        logger.debug(f"Embedding {len(texts)} texts...")

        result = self.client.models.embed_content(
            model=self.embedding_model,
            contents=texts,
        )

        # Extract embeddings from response
        return [emb.values for emb in result.embeddings]

    async def embed_async(self, texts: list[str]) -> list[list[float]]:
        """Async embedding.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        logger.debug(f"Embedding {len(texts)} texts async...")

        result = await self.client.aio.models.embed_content(
            model=self.embedding_model,
            contents=texts,
        )

        return [emb.values for emb in result.embeddings]
