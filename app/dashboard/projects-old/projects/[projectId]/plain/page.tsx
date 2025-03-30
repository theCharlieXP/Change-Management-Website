export default function PlainHtmlPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  const now = new Date().toISOString();
  
  // This is a very simple page that uses no client-side JavaScript
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ color: "#111827", marginTop: 0 }}>Plain HTML Test Page</h1>
      <p>
        This is a very basic test page with no client-side JavaScript or React hydration.
      </p>
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "4px",
          padding: "16px",
          marginTop: "20px",
        }}
      >
        <p>
          <strong>Project ID:</strong> {projectId}
        </p>
        <p>
          <strong>Rendered at:</strong> {now}
        </p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <a
          href={`/dashboard/projects/${projectId}`}
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
            marginRight: "10px",
          }}
        >
          Go to Full Project Page
        </a>
        <a
          href="/dashboard/projects"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#e5e7eb",
            color: "#374151", 
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Back to Projects
        </a>
      </div>
    </div>
  );
} 