const base64urlEncode = (input: Uint8Array): string => {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

const base64urlDecode = (input: string): Uint8Array => {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(base64, "base64")
}

export const UUIDToShort = (uuid: string): string => {
  const hex = uuid.replace(/-/g, "")
  const elements = Array.from(hex.match(/.{2}/g) ?? []).map(byte => parseInt(byte, 16))
  const bytes = Uint8Array.from(elements)
  return base64urlEncode(bytes)
}

export const shortToUUID = (short: string): string => {
  const bytes = base64urlDecode(short)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-")
}
