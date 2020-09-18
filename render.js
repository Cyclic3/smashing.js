// From https://stackoverflow.com/a/11562550
function array2base64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function base642ab(buf) {
  return str2ab(atob(buf));
}

function create_padding(obj) {
  var ret = new Uint8Array(obj["size"]);
  ret.fill(parseInt(obj["byte"], 16));
  return {"type": "bytes", "val": ret};
}

function create_integer(obj) {
  var size = parseInt(obj["size"]);
  if (Number.isNaN(size))
    size = undefined;
  return {"type": "int", "val": BigInt(obj["value"]), "size": size};
}

function _finish_string(str) {
  return {"type": "bytes", "val": new TextEncoder().encode(str)};
}

function create_raw(obj) {
  var val = obj["value"];
  switch (obj["encoding"]) {
  case "utf8-null": return _finish_string(val + "\0");
  case "c":
    // We need to do this to get all escape sequences (JSON only supports a subset)
    //
    // I'm really sorry

    // Check for unescaped quote used to escape sandbox
    if (/([^\\]|^)(\\\\)*"/.test(val))
      throw new Error("Nice try, please go away!");
    return _finish_string(eval(`"${val}"`));

  case "base64": return {"type": "bytes", "val": new Uint8Array(base642ab(val))};

  case "hex":
    // SOURCE: modified from https://stackoverflow.com/a/50868276
    if (val.length == 0 || val.length & 0x1)
      throw new Error("Could not parse hex!");
    val.replace(/[\S]/g, '');
    return {"type": "bytes", "val": new Uint8Array(val.match(/.{1,2}/g).map(function (byte) {
      if (!/^[\da-fA-F]{2}$/.test(byte))
        throw new Error("Could not parse hex!");
      return parseInt(byte, 16);
    }))};
  default:
    throw new Error("Unknown encoding");
  }
}

function create_relative(obj) {
  var neg = false;
  var val = obj["value"];
  if (val[0] == '-') {
    neg = true;
    val = val.slice(1);
  }
  var size = parseInt(obj["size"]);
  if (Number.isNaN(size))
    size = undefined;
  return {"type": "relative", "val": neg ? -BigInt(val) : BigInt(val), "size": size, "base": obj["base"]};
}

function render(obj) {
  bytes = [];

  obj["data"].forEach(function (i) {
    var val = i["val"];
    switch (i["type"]) {
    case "bytes": val.forEach(x => bytes.push(x)); break;
    case "relative": {
      val += BigInt(obj["bases"][i["base"]]);
    } /* fallthrough */
    case "int": {
      var size = i["size"];
      if (size === undefined)
        size = obj["word"];
      var tmp_arr = new Uint8Array(size); // default init'ed to 0
      var i_val = val;

      for (var i = 0; i_val != 0n && i < size; ++i, i_val /= 256n)
        tmp_arr[i] = Number(i_val % 256n);

      if (obj["be"])
        tmp_arr.reverse();

      tmp_arr.forEach(x => bytes.push(x))
    } break;
    }
  });

  return array2base64(bytes);
}
