import threading
from typing import Optional

import FreeSimpleGUI as sg
import uvicorn

from utils.log import setupLogger
from web.app import app


class State:
    def __init__(self):
        self.logger = setupLogger()

        # editable
        self.server: Optional[uvicorn.Server] = None
        self.webThread: Optional[threading.Thread] = None

    def launchWebServer(self, host: str, port: int, https: bool):
        config = uvicorn.Config(
            app=app,
            host=host,
            port=port,
            ssl_keyfile="key.pem" if https else None,
            ssl_certfile="cert.pem" if https else None,
        )
        self.server = uvicorn.Server(config)
        self.webThread = threading.Thread(target=self.server.run)
        self.webThread.start()

    def stopWebServer(self):
        if self.server:
            self.server.should_exit = True
        if self.webThread:
            self.webThread.join()


state = State()


def main():
    layout = [
        [sg.Text("ホスト")],
        [sg.Input(default_text="0.0.0.0", key="host")],
        [sg.Text("ポート")],
        [sg.Input(default_text="19810", key="port")],
        [sg.Checkbox("HTTPS化", key="https")],
        [sg.Button("起動", key="toggle")],
    ]

    window = sg.Window("OtogePad", layout)
    running = False

    while True:
        event, values = window.read()

        if event == sg.WINDOW_CLOSED:
            if running:
                state.stopWebServer()
            break

        if event == "toggle":
            if not running:
                state.launchWebServer(
                    values["host"], int(values["port"]), values["https"]
                )
                window["toggle"].update("停止")
                running = True
            else:
                state.stopWebServer()
                window["toggle"].update("起動")
                running = False


if __name__ == "__main__":
    main()
