import time

import rtmidi

# MIDIアウトポートを開く
midiout = rtmidi.MidiOut()
available_ports = midiout.get_ports()
print("利用可能なポート:", available_ports)

# 仮想MIDIポートを選択（loopMIDIやIAC Driverのポート番号）
# 例: available_ports に "loopMIDI Port 1" が表示されたらそのインデックス
midiout.open_port(1)  # ← インデックスは環境に合わせて変更

# C2のMIDIノート番号は 36
NOTE_ON = 0x90  # チャンネル1のNote On
NOTE_OFF = 0x80  # チャンネル1のNote Off
C2 = 36
VELOCITY = 100

try:
    while True:
        # Note On 送信
        midiout.send_message([NOTE_ON, C2, VELOCITY])
        time.sleep(1)

        # Note Off 送信
        midiout.send_message([NOTE_OFF, C2, 0])

        time.sleep(1)
except KeyboardInterrupt:
    pass

del midiout
