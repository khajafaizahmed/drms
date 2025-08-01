export default function Query1() {
    return (
        <>
        <div className="hero-section">
        <div className="container text-center d-flex flex-column">
                <h1 className="display-4">Disaster Response Management System</h1>
                <p className="lead">Explore and manage disaster incidents and resources seamlessly with an interactive map</p>
                <a href="employee.html" className="btn btn-success btn-lg mt-3">View Resource Allocation</a>
                <a href="department.html" className="btn btn-success btn-lg mt-3">View Connections</a>
                <a href="project.html" className="btn btn-success btn-lg mt-3">Distance Search</a>
                <a href="worksOn.html" className="btn btn-success btn-lg mt-3">View By Date</a>
                <div className="my-3"></div>
        </div>
    </div>

    <div className="container">
        <div className="row">
            <div className="col-md-4">
                <div className="feature-box">
                    <h3><i className="fas fa-tasks"></i> Project Overview</h3>
                    <p>Build a full-stack web application to manage the Disaster Response Management System database.</p>
                </div>
            </div>
            <div className="col-md-4">
                <div className="feature-box">
                    <h3><i className="fas fa-code"></i> Technical Stack</h3>
                    <div className="tech-badge">Node.js</div>
                    <div className="tech-badge">Express</div>
                    <div className="tech-badge">MariaDB</div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="feature-box">
                    <h3><i className="fas fa-database"></i> Features</h3>
                    <ul className="list-unstyled">
                        <li>✓ Incident Management</li>
                        <li>✓ Resource Management</li>
                        <li>✓ Incident-Resource Allocation</li>
                        <li>✓ Distance Search</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <footer className="bg-light mt-5 py-3">
        <div className="container text-center">
            <p className="text-muted">TCSS 445 - Database Systems Design © 2024</p>
        </div>
    </footer>
        </>
    );
}