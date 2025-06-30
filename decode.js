// Simple Caesar cipher decoder
function caesarDecode(text, shift) {
  return text.split('').map(char => {
    if (char >= 'a' && char <= 'z') {
      return String.fromCharCode((char.charCodeAt(0) - 'a'.charCodeAt(0) + shift) % 26 + 'a'.charCodeAt(0));
    }
    if (char >= 'A' && char <= 'Z') {
      return String.fromCharCode((char.charCodeAt(0) - 'A'.charCodeAt(0) + shift) % 26 + 'A'.charCodeAt(0));
    }
    return char;
  }).join('');
}

const input = "vqst zxdi fmcr vjgn";
console.log("Trying different Caesar cipher shifts:");

for (let shift = 1; shift <= 25; shift++) {
  const decoded = caesarDecode(input, shift);
  console.log(`Shift ${shift}: ${decoded}`);
}