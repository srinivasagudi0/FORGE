function Insights() {

    function goBack() {
        window.history.back();
    }

    return (
        <main>
            <div className="header">
                <h1>Insights</h1>
                <span className="forge-id">Project #{id}</span>
                <button onClick={goBack}>Back</button>
            </div>
            <section className="content">
                <div className="repo-overview">
                    <h2>Repository Overview</h2>
                </div>
                <div className="git-status">
                    <h2>Git Status</h2>
                </div>
                <div className="recent-commits">
                </div>
            </section>
        </main>
    )
}

export default Insights;
