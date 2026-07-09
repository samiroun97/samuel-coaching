import sharp from "sharp";

const sizes = [
  { size: 512, out: "public/icons/icon-512.png" },
  { size: 192, out: "public/icons/icon-192.png" },
  { size: 180, out: "public/icons/apple-icon.png" },
];

for (const { size, out } of sizes) {
  await sharp("public/icons/logo-source.svg")
    .resize(size, size, { fit: "contain", background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(out);
  console.log(`Done: ${out}`);
}
