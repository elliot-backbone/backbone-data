import './LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <img src="/src/assets/backbone_white.svg" alt="Backbone" className="landing-logo" />
          <button className="landing-nav-btn" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Portfolio Management
            <br />
            Built for Action
          </h1>
          <p className="hero-subtitle">
            Real-time priority detection that surfaces critical risks before they become problems.
            Stop drowning in dashboards. Start leading from the front.
          </p>
          <button className="hero-cta" onClick={onGetStarted}>
            Launch Dashboard
          </button>
        </div>
      </section>

      <section className="features">
        <div className="features-content">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Intelligent Prioritization</h3>
            <p className="feature-description">
              Automated risk detection across capital sufficiency, revenue viability, and fundraising momentum.
              Your attention where it matters most.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Portfolio Health at a Glance</h3>
            <p className="feature-description">
              Real-time health scoring across your entire portfolio. Identify struggling companies
              before runway becomes critical.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Action-First Design</h3>
            <p className="feature-description">
              Every alert comes with suggested actions and urgency scoring. No more guessing
              what to do next or who needs help.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Portfolio Management?</h2>
          <p className="cta-text">
            Generate realistic demo data or import your own portfolio to see Backbone in action.
          </p>
          <button className="cta-button" onClick={onGetStarted}>
            Get Started Now
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">Built for venture capital and growth equity firms</p>
        </div>
      </footer>
    </div>
  );
}
