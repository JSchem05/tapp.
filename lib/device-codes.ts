const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateStaffCode(length = 6) {
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += CODE_CHARS[randomValues[index] % CODE_CHARS.length];
  }
  return code;
}
