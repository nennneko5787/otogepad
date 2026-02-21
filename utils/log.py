import logging
from logging import FileHandler, Formatter, Logger, StreamHandler

from colorama import Fore, Style, init

init(autoreset=True)


class CustomFormatter(Formatter):
    COLOR_FORMAT = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.GREEN,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLOR_FORMAT.get(record.levelno, Fore.WHITE)
        message = super().format(record)
        return f"{color}{message}{Style.RESET_ALL}"


def setupLogger() -> Logger:
    """ロガーを設定し、コンソールとファイルの両方にログを出力します。
    Returns:
        Logger: 設定されたロガー。
    """
    logger = logging.getLogger("otogePad")
    logger.setLevel(logging.DEBUG)

    consoleHandler = StreamHandler()
    consoleHandler.setLevel(logging.INFO)
    consoleHandler.setFormatter(
        CustomFormatter("%(asctime)s [%(levelname)-8s] %(message)s")
    )
    logger.addHandler(consoleHandler)

    fileHandler = FileHandler("latest.log", mode="w", encoding="utf-8")
    fileHandler.setLevel(logging.DEBUG)
    fileHandler.setFormatter(
        logging.Formatter(
            "%(asctime)s [%(levelname)-8s] %(filename)s:%(name)s:%(lineno)s %(funcName)s: %(message)s\n%(exc_info)s"
        )
    )
    logger.addHandler(fileHandler)

    return logger
