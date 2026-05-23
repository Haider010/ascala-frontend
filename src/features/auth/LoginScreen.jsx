import React from "react";
import { ArrowRight, CircleAlert, LockKeyhole } from "lucide-react";
import { heroArtworkUrl } from "../../config/assets";
import { LOGIN_PASSWORD, LOGIN_USERNAME } from "../../config/auth";
import { LogoMark } from "../../components/shared/LogoMark";

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (username.trim() === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
      setError("");
      onLogin();
      return;
    }

    setError("Invalid username or password.");
  }

  return (
    <main className="login-shell" style={{ "--hero-art": `url("${heroArtworkUrl}")` }}>
      <section className="login-copy" aria-label="Ascala GHL App">
        <div className="hero-brand">
          <LogoMark />
          <span>
            <strong>ASCALA</strong>
            <small>GHL APP</small>
          </span>
        </div>
        <h1>
          You don&apos;t need more tools.
          <span>You need an AI team.</span>
        </h1>
        <div className="hero-rule" />
        <p>
          ASCALA - <span>GHL App</span>
        </p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-mark">
          <LockKeyhole size={24} />
        </div>
        <div>
          <p className="eyebrow">Protected Console</p>
          <h2 id="login-title">Admin Login</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <div className="login-error" role="alert">
              <CircleAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="login-button" type="submit">
            <span className="arrow-circle">
              <ArrowRight size={24} />
            </span>
            <span>Enter Ascala</span>
          </button>
        </form>
      </section>
    </main>
  );
}
