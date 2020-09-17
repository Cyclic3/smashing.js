"""
  A simple helper script for binary exploitation

  Prefixes (with uppercase denoting no newline):
  s       string
  b       base64
  x       hex
  f       file from path
"""
import base64
import sys

while True:
  line = input()

  if len(line) <= 1:
    print("?", file=sys.stderr)
    continue


  cmd = line[0].lower()
  res = None
  try:
    if cmd == 's':
      res = line[1:].encode('utf-8')
    elif cmd == 'b':
      res = base64.b64decode(line[1:])
    elif cmd == 'x':
      res = bytes.fromhex(line[1:]);
    elif cmd == 'f':
      with open(line[1:], "rb") as file:
        res = file.read()
    else:
      print("?", file=sys.stderr)
      continue
  except:
    print("!", file=sys.stderr)
    continue

  sys.stdout.buffer.write(res)
  # Simple lower case check
  if cmd == line[0]:
    sys.stdout.buffer.write(b"\n")
  sys.stdout.flush();
