export function AboutUs() {
  return (
    <div className="about-us-page">
      <div className="about-header">
        <h1>About FoodHub</h1>
        <p className="tagline">Connecting students with quality food, one stall at a time</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>What is FoodHub?</h2>
          <p>
            FoodHub is a comprehensive food discovery and management platform designed for TUP-Taguig students
            and food vendors. Our platform makes it easy for students to explore and discover food stalls across
            campus, while empowering vendors with tools to manage their stalls, menus, and customer feedback in
            real-time.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            To revolutionize the campus food experience by providing a seamless, transparent platform that connects
            hungry students with diverse, quality food vendors while enabling vendors to grow their business through
            data-driven insights and customer engagement.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          <ul className="features-list">
            <li>🔍 Discover stalls and menu items across campus</li>
            <li>⭐ Read and write reviews for food quality</li>
            <li>💰 Track your food budget and spending</li>
            <li>❤️ Save favorite stalls and items</li>
            <li>📊 Analytics and trends for data-driven dining</li>
            <li>🏪 Vendor dashboard for full stall management</li>
            <li>📱 Real-time updates and availability toggles</li>
          </ul>
        </section>

        <section className="about-section credits">
          <h2>Credits</h2>
          <div className="credits-info">
            <div className="credit-card">
              <h3>Developer</h3>
              <p className="credit-name">Aia A. Garcia</p>
              <p className="credit-details">BSIT-S-T-3A-T</p>
              <p className="credit-school">Technological University of the Philippines - Taguig</p>
            </div>
            <div className="credit-card">
              <h3>Professor</h3>
              <p className="credit-name">Prof. Joanne A. Mag-isa</p>
              <p className="credit-details">Course Advisor & Mentor</p>
              <p className="credit-school">Technological University of the Philippines - Taguig</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-category">
              <h4>Frontend</h4>
              <p>React, TypeScript, Vite</p>
            </div>
            <div className="tech-category">
              <h4>Backend</h4>
              <p>Node.js, Express, TypeScript</p>
            </div>
            <div className="tech-category">
              <h4>Database</h4>
              <p>MongoDB, Mongoose</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="about-footer">
        <p>&copy; 2024 FoodHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
