import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react'

function Insights() {

    const { id } = useParams();
    const [gitData, setGitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    function goBack() {
        window.history.back();
    }

    useEffect(() => {
        fetch(`http://localhost:5000/api/projects/${id}/git`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch Git information");
                }
                return response.json();
            })
            .then(data => {
                setGitData(data);
            })
            .catch(error => {
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    return (
        <main>
            {loading && <p>Loading Git information...</p>}
            {error && <p>Error: {error}</p>}
            
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
                    {gitData?.is_git_repo ? (
                        <p>Current Branch: {gitData.branch}</p>
                    ) : (
                        <p>This is not a Git repository.</p>
                    )}
                    {gitData?.is_git_repo && (
                        <ul>
                            {gitData.changes?.map((file,index) => (
                                <li key={index}>{file}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="recent-commits">
                    <h2>Recent Commits</h2>
                </div>
            </section>
        </main>
    )
}

export default Insights;
