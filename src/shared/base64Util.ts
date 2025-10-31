export function base64ToBase64Url(base64: string): string
{
  base64 = base64.replaceAll("/", "_");
  base64 = base64.replaceAll("+", "-");
  base64 = base64.replaceAll("=", "");
  return base64;
}

export function base64UrlToBase64(base64Url: string): string
{
  base64Url = base64Url.replaceAll("_", "/");
  base64Url = base64Url.replaceAll("-", "+");
  while (base64Url.length % 4 != 0)
  {
    base64Url = base64Url + "=";
  }
  return base64Url;
}

export function stringToBase64(str: string) : string
{
  const encoder = new TextEncoder();
  const array = encoder.encode(str);
  return array.toBase64();
}

export function base64ToString(base64String: string) : string
{
  let compressedData = new Uint8Array(Math.ceil(base64String.length * (3 / 4)));
  const result = compressedData.setFromBase64(base64String);
  compressedData = new Uint8Array(compressedData.buffer, 0, result.written);
  const decoder = new TextDecoder();
  return decoder.decode(compressedData);
}