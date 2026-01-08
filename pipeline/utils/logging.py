"""Logging configuration for pipeline."""

import logging
from typing import Literal

from rich.console import Console
from rich.logging import RichHandler

# Console for rich output
console = Console()

# Track if logging is already configured
_configured = False


def setup_logging(
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO",
) -> None:
    """Configure logging with Rich handler.

    Args:
        level: Logging level
    """
    global _configured
    if _configured:
        return

    # Configure root logger
    logging.basicConfig(
        level=level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[
            RichHandler(
                console=console,
                rich_tracebacks=True,
                show_path=False,
            )
        ],
    )

    # Reduce noise from external libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)

    _configured = True


def get_logger(name: str) -> logging.Logger:
    """Get logger for module.

    Args:
        name: Module name (typically __name__)

    Returns:
        Configured logger
    """
    setup_logging()
    return logging.getLogger(name)
