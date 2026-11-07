import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react'

function Insights() {

    const { id } = useParams();
    const [gitData, setGitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const changes = gitData?.changes || [];
    const staged = changes.filter(file =>
        file[0] !== " " && file[0] !== "?"
    );
    const unstaged = changes.filter(file =>
        file[1] !== " " && file[1] !== "?"
    );
    const untracked = changes.filter(file =>
        file.startsWith("??")
    );

    const [commits, setCommits] = useState([]);
    const [commitAuthor, setCommitAuthor] = useState(null);
    const [commitDate, setCommitDate] = useState(null);
    const [commitMessage, setCommitMessage] = useState(null);
    const [commitFiles, setCommitFiles] = useState([]);
    const [commitDiff, setCommitDiff] = useState(null);
    const [commitExpanded, setCommitExpanded] = useState(false);
    const [remote, setRemote] = useState(null);
    const [repoName, setRepoName] = useState(null);


    function goBack() {
        window.history.back();
    }

    function reFetch() {
        setLoading(true);
        setError("");
        fetch(`http://localhost:5000/api/projects/${id}/git`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch Git information");
                }

                return response.json();
            })
            .then(data => {
                setGitData(data);
                setCommits(data.commits || []);
                setRemote(data.remote || null);
                setRepoName(data.repo_name || null);
            })
            .catch(error => {
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
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
                setCommits(data.commits || []);
                setRemote(data.remote || null);
                setRepoName(data.repo_name || null);
            })
            .catch(error => {
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    async function expandCommit(commit) {
        setCommitExpanded(true);
        setCommitAuthor(commit.author);
        setCommitDate(commit.date);
        setCommitMessage(commit.message);

        const response = await fetch(
            `http://localhost:5000/api/projects/${id}/git/commits/${commit.hash}`
        );

        if (!response.ok) {
            setError("Failed to load commit details");
            return;
        }
        const data = await response.json();

        setCommitFiles(data.files_changed || []);
        setCommitDiff(data.commit_details || "");
    }

    return (
        <main>
            {loading && <p>Loading Git information...</p>}
            {error && <p>Error: {error}</p>}
            
            <div className="header">
                <h1>Insights</h1>
                <span className="forge-id">Project #{id}</span>
                <button onClick={goBack}>Back</button>
                <button onClick={reFetch}>Refresh</button>
            </div>
            <section className="content">
                <div className="repo-overview">
                    <h2>Repository Overview</h2>
                </div>
                <div className="git-status">
                    <h2>Git Status</h2>
                    {gitData?.is_git_repo === true && (
                        <p>Current Branch: {gitData.branch}</p>
                    )}

                    {gitData?.is_git_repo === false && (
                        <p>This is not a Git repository.</p>
                    )}
                    {gitData?.is_git_repo && (
                        <div>
                            <h3>Staged Changes ({staged.length})</h3>
                            <ul>
                                {staged.map((file, index) => (
                                    <li key={index}>{file.slice(2)}</li>
                                ))}
                            </ul>
                            <h3>Unstaged Changes ({unstaged.length})</h3>
                            <ul>
                                {unstaged.map((file, index) => (
                                    <li key={index}>{file.slice(3)}</li>
                                ))}
                            </ul>
                            <h3>Untracked Files ({untracked.length})</h3>
                            <ul>
                                {untracked.length > 0 ? (
                                    untracked.map((file,index) => (
                                        <li key={index}>{file.slice(3)}</li>
                                    ))
                                ):(
                                    <p>No untracked files.</p>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="recent-commits">
                    <h2>Recent Commits</h2>
                    {commits.length > 0 ? (
                        <ul>
                            {commits.map((commit, index) => (
                                <li key={index}>
                                    <button onClick={() =>expandCommit
                                        (commit)
                                    }>{commit.message}</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No recent commits found.</p>
                    )}
                </div>
                <div className="remote-info">
                    <h2>Remote Information</h2>
                    {remote && (
                        <p><strong>Remote:</strong> {remote}</p>
                    )}
                    {repoName && (
                        <p><strong>Repository Name:</strong> {repoName}</p>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Insights;
