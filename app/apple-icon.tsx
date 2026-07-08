import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 7,
        border: "3px solid #c9a84c",
        display: "flex",
      }} />
      <span style={{
        color: "#c9a84c",
        fontSize: 105,
        fontWeight: 700,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1,
        marginTop: -8,
      }}>
        S
      </span>
    </div>,
    { width: 180, height: 180 }
  );
}
