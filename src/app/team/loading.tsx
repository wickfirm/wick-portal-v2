export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>Loading...</div>
        <div style={{ color: "#888" }}>Please wait</div>
      </div>
    </div>
  );
}
