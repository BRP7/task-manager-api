import { useEffect, useState } from "react";

const defaultMinutes = 30;

export default function TaskForm({ hasPrimaryTask, isSubmitting, onCreateTask }) {
  const [form, setForm] = useState({
    title: "",
    type: hasPrimaryTask ? "secondary" : "primary",
    estimatedTime: defaultMinutes
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      type: hasPrimaryTask && current.type === "primary" ? "secondary" : current.type
    }));
  }, [hasPrimaryTask]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const created = await onCreateTask({
      title: form.title.trim(),
      type: form.type,
      estimatedTime: Number(form.estimatedTime)
    });

    if (created) {
      setForm({
        title: "",
        type: hasPrimaryTask ? "secondary" : "primary",
        estimatedTime: defaultMinutes
      });
    }
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">New Task</p>
          <h2>Plan today with one focused primary and supporting secondary work</h2>
        </div>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          <span>Task title</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Finish API integration"
            required
          />
        </label>

        <div className="task-form-grid">
          <label>
            <span>Task type</span>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="primary" disabled={hasPrimaryTask}>
                Primary
              </option>
              <option value="secondary">Secondary</option>
            </select>
          </label>

          <label>
            <span>Estimated time (minutes)</span>
            <input
              min="1"
              name="estimatedTime"
              type="number"
              value={form.estimatedTime}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {hasPrimaryTask ? (
          <p className="helper-text">A primary task already exists for today, so new tasks will be secondary.</p>
        ) : (
          <p className="helper-text">Create the primary task first so you can unlock secondary tasks cleanly.</p>
        )}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Task"}
        </button>
      </form>
    </section>
  );
}
