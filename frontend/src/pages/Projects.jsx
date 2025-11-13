import Card from "../components/Card";

export default function Projects() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <Card title="Add Project">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="form-label">Title</label>
            <input className="input" />
          </div>
          <div>
            <label className="form-label">Link</label>
            <input className="input" placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea className="input" rows={4} />
          </div>
          <button className="btn btn-primary sm:col-span-2">Save</button>
        </form>
      </Card>

      <Card title="Your Projects">
        <p className="text-gray-600">No entries yet.</p>
      </Card>
    </div>
  );
}
