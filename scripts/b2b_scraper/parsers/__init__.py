"""B2B site parsers."""

from .ergen import ErgenParser
from .bayikanali import BayikanaliParser
from .b2bdepo import B2BDepoParser
from .tesan import TesanParser
from .edenge import EdengeParser
from .inox import InoxParser

__all__ = [
    "ErgenParser",
    "BayikanaliParser",
    "B2BDepoParser",
    "TesanParser",
    "EdengeParser",
    "InoxParser",
]
