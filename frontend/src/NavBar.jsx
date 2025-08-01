export default function NavBar() {
    return (
        <nav className="navbar navbar-expand-sm bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="/">DRMS</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav">
                        <a className="nav-link" href="/map">Map</a>
                        <a className="nav-link" href="/query1">Resource Allocation</a>
                        <a className="nav-link" href="/query2">Connections</a>
                        <a className="nav-link" href="/query3">Distance</a>
                        <a className="nav-link" href="/query4">Date</a>
                    </div>
                </div>
            </div>
        </nav>
    );
}