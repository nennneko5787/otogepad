import asyncio

# import pydirectinput
import vgamepad as vg
from fastapi import APIRouter, WebSocket
from fastapi.websockets import WebSocketDisconnect

# IIDX_KEYMAP = ["z", "s", "x", "d", "c", "f", "v"]

gamepad = vg.VX360Gamepad()

IIDX_KEYMAP_CONTROLLER = [
    vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
    vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB,
]

router = APIRouter()


@router.websocket("/iidx/ws")
async def iidxGateway(ws: WebSocket):
    await ws.accept()
    # pressed = set()
    pressedController = set()
    try:
        while True:
            data = await ws.receive_json()
            # current = set()
            currentController = set()
            for i in range(len(IIDX_KEYMAP_CONTROLLER)):
                if len(data) <= i:
                    break

                if data[i] is True:
                    # current.add(IIDX_KEYMAP[i])
                    currentController.add(IIDX_KEYMAP_CONTROLLER[i])

            """
            for key in current - pressed:
                asyncio.create_task(asyncio.to_thread(pydirectinput.keyDown, key))
            for key in pressed - current:
                asyncio.create_task(asyncio.to_thread(pydirectinput.keyUp, key))
            """

            for btn in currentController - pressedController:
                asyncio.create_task(asyncio.to_thread(gamepad.press_button, button=btn))
            for btn in pressedController - currentController:
                asyncio.create_task(
                    asyncio.to_thread(gamepad.release_button, button=btn)
                )
            if currentController != pressedController:
                asyncio.create_task(asyncio.to_thread(gamepad.update))

            # pressed = current
            pressedController = currentController
    except WebSocketDisconnect:
        """
        for key in pressed:
            await asyncio.to_thread(pydirectinput.keyUp, key)
        """
        for btn in pressedController:
            await asyncio.to_thread(gamepad.release_button, btn)
