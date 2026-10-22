/**
 * Generates a valid uncompressed SWF (FWS) binary file in JavaScript.
 * Valid SWF header:
 * - 'FWS' (3 bytes)
 * - Version: 8 (1 byte, 0x08)
 * - File Length (4 bytes, little-endian)
 * - Frame Size RECT (bits representation for bounds: 0 to 8000 twips = 400x300 px)
 * - Frame Rate: 24 fps (2 bytes, 0x00, 0x18)
 * - Total Frames: 1 (2 bytes, 0x01, 0x00)
 * - Tags:
 *   - Tag: SetBackgroundColor (tag code 9, length 3) -> R, G, B
 *   - Tag: ShowFrame (tag code 1, length 0)
 *   - Tag: End (tag code 0, length 0)
 */

export function createValidSampleSwf(title: string, bgColorHex: string = '#1E293B'): Blob {
  // Parse hex color
  const hex = bgColorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '1e', 16);
  const g = parseInt(hex.substring(2, 4) || '29', 16);
  const b = parseInt(hex.substring(4, 6) || '3b', 16);

  // RECT bit manipulation for (0, 11000 twips width [550px], 0, 8000 twips height [400px])
  // NBits = 15
  // NBits (5 bits) = 01111 (15)
  // Xmin = 0 (15 bits)
  // Xmax = 11000 = 0x2AF8 = 010 1010 1111 1000 (15 bits)
  // Ymin = 0 (15 bits)
  // Ymax = 8000 = 0x1F40 = 001 1111 0100 0000 (15 bits)
  // Total bits = 5 + 15 + 15 + 15 + 15 = 65 bits = 9 bytes (padded with 7 zeros)
  
  // We can use a precalculated standard 550x400 RECT (common standard Flash default):
  // 550px * 20 twips/px = 11000 twips. 400px * 20 = 8000 twips.
  const rectBytes = [
    0x78, 0x00, 0x05, 0x5F, 0x00, 0x00, 0x0F, 0xA0, 0x00
  ];

  // Tags:
  // SetBackgroundColor (Tag Type 9, Short Header: (9 << 6) | 3 = 0x0243)
  const setBgTag = [
    0x43, 0x02, // Tag Header: 9 (0x0240) + 3 bytes length (0x0003) = 0x0243
    r, g, b     // Color RGB
  ];

  // ShowFrame tag (Tag Type 1, length 0 -> (1 << 6) | 0 = 0x0040)
  const showFrameTag = [0x40, 0x00];

  // End tag (Tag Type 0, length 0 -> 0x0000)
  const endTag = [0x00, 0x00];

  // Payload: rectBytes + frameRate (24fps: 0x00, 0x18) + frameCount (1: 0x01, 0x00) + tags
  const payload = [
    ...rectBytes,
    0x00, 0x18, // 24 fps
    0x01, 0x00, // 1 frame
    ...setBgTag,
    ...showFrameTag,
    ...endTag,
  ];

  const totalLength = 8 + payload.length; // 8 bytes header + payload

  const header = [
    0x46, 0x57, 0x53, // 'F', 'W', 'S'
    0x08,             // Version 8 (Flash 8 / Macromedia)
    totalLength & 0xFF,
    (totalLength >> 8) & 0xFF,
    (totalLength >> 16) & 0xFF,
    (totalLength >> 24) & 0xFF,
  ];

  const allBytes = new Uint8Array([...header, ...payload]);
  return new Blob([allBytes], { type: 'application/x-shockwave-flash' });
}

export function downloadSampleSwfFile(filename: string = 'simulasi_optik_demo.swf') {
  const blob = createValidSampleSwf('Flash Learn Demo', '#0F172A');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
