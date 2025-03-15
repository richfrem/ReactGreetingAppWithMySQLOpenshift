import { useState, useEffect } from "react";
import { Greeting, NewGreeting } from "./types";
import { getGreetings, createGreeting } from "./services/api";

function App() {
  const [greetings, setGreetings] = useState<Greeting[]>([]);
  const [newGreeting, setNewGreeting] = useState<NewGreeting>({
    name: "",
    greeting: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGreetings();
  }, []);

  const fetchGreetings = async () => {
    try {
      setLoading(true);
      const data = await getGreetings();
      setGreetings(data);
      setError(null);
    } catch (err: unknown) {
      setError("Failed to fetch greetings");
      console.error("Error fetching greetings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const greeting = await createGreeting(newGreeting);
      setGreetings([...greetings, greeting]);
      setNewGreeting({ name: "", greeting: "" });
      setError(null);
    } catch (err: unknown) {
      setError("Failed to create greeting");
      console.error("Error creating greeting:", err);
    }
  };

  return (
    <div className="app-container">
      <header className="bcgov-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <a className="navbar-brand" href="https://gov.bc.ca">
              <img
                src="/images/bcid-logo-rev-en.svg"
                alt="B.C. Government Logo"
              />
            </a>
            <h1 className="bcgov-title">Greetings App</h1>
          </div>
        </nav>
      </header>

      <main className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="greeting-form">
              <h2 className="mb-4">Add New Greeting</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={newGreeting.name}
                    onChange={(e) =>
                      setNewGreeting({ ...newGreeting, name: e.target.value })
                    }
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="greeting">Greeting</label>
                  <input
                    type="text"
                    className="form-control"
                    id="greeting"
                    value={newGreeting.greeting}
                    onChange={(e) =>
                      setNewGreeting({
                        ...newGreeting,
                        greeting: e.target.value,
                      })
                    }
                    required
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Greeting
                </button>
              </form>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="d-flex justify-content-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="greeting-list">
                {greetings.map((greeting) => (
                  <div key={greeting.id} className="greeting-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{greeting.name}:</strong> {greeting.greeting}
                        <div className="greeting-meta">
                          {new Date(greeting.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bcgov-footer mt-5">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://www2.gov.bc.ca/gov/content/home"
                >
                  BC Government
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://www2.gov.bc.ca/gov/content/home/disclaimer"
                >
                  Disclaimer
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://www2.gov.bc.ca/gov/content/home/privacy"
                >
                  Privacy
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="https://www2.gov.bc.ca/gov/content/home/accessibility"
                >
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </footer>
    </div>
  );
}

export default App;
