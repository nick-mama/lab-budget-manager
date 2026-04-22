import EditProjectForm from "./edit-project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`http://localhost:4000/api/projects/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();

    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">Could not load project</h1>
        <p className="text-sm text-red-600">Status: {res.status}</p>
        <p className="text-sm">Requested ID: {id}</p>
        <pre className="mt-3 rounded border p-3 text-sm whitespace-pre-wrap">
          {text || "Unknown error"}
        </pre>
      </div>
    );
  }

  const project = await res.json();

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Project</h1>
      <EditProjectForm project={project} />
    </div>
  );
}
