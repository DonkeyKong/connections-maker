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