import asyncio
import sys

from fastapi import APIRouter, Body, WebSocket
from fastapi.websockets import WebSocketDisconnect

import rtmidi

router = APIRouter()

midiout = rtmidi.MidiOut()
if sys.platform != "win32":
    midiout.open_virtual_port("OtogePad-Nostalgia")


class State:
    def __init__(self):
        self.port: int = 0


@router.get("/nostalgia/ports")
def outputPorts():
    return midiout.get_ports()


@router.post("/nostalgia/ports")
def setPort(port: int = Body()):
    if midiout.is_port_open():
        midiout.close_port()
    midiout.open_port(port)
    return {"detail": "OK"}


WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]


def keyToNote(i: int) -> int:
    octave, degree = divmod(i, 7)
    return 36 + octave * 12 + WHITE_KEYS[degree]


@router.websocket("/nostalgia/ws")
async def nostalgiaGateway(ws: WebSocket):
    await ws.accept()
    pressed = set()
    try:
        while True:
            data = await ws.receive_json()
            current = set()
            for i in range(48):
                if len(data) <= i:
                    break

                if data[i] is True:
                    current.add(keyToNote(i))

            for key in current - pressed:
                asyncio.create_task(
                    asyncio.to_thread(midiout.send_message, [0x90, key, 112])
                )
            for key in pressed - current:
                asyncio.create_task(
                    asyncio.to_thread(midiout.send_message, [0x80, key, 0])
                )

            pressed = current
    except WebSocketDisconnect:
        """
        for key in pressed:
            await asyncio.to_thread(pydirectinput.keyUp, key)
        """
        for key in pressed:
            asyncio.create_task(asyncio.to_thread(midiout.send_message, [0x80, key, 0]))
