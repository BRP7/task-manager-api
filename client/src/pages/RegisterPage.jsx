import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      await api.post("/users/register", form);
      navigate("/login", {
        replace: true,
        state: { notice: "Registration successful. Please sign in." }
      });
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Task Orbit</p>
        <h1>Create your account</h1>
        <p>Register once, then manage today's focus from a single dashboard.</p>

        {notice ? <p className="notice notice-error">{notice}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" onChange={handleChange} required type="text" value={form.name} />
          </label>

          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="new-password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </label>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
