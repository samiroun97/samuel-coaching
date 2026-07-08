import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Gold border */}
      <div style={{
        position: "absolute",
        inset: 20,
        border: "6px solid #c9a84c",
        display: "flex",
      }} />
      {/* S */}
      <span style={{
        color: "#c9a84c",
        fontSize: 300,
        fontWeight: 700,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1,
        marginTop: -20,
      }}>
        S
      </span>
    </div>,
    { width: 512, height: 512 }
  );
}
