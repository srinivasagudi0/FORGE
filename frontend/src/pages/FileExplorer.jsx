import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function FileExplorer() {
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [Loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [currentPath, setCurrentPath] = useState("");

    function goBack() {
        navigate(-1);
    }

    function goUp() {
        if (!currentPath) return;

        const folders = currentPath.split("/");
        folders.pop();

        setCurrentPath(folders.join("/"));
    }

    function openFolder(folderName) {
        setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
    }

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:5000/api/projects/${id}/files?path=${encodeURIComponent(currentPath)}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load files');
                return response.json();
            })
            .then (data => {
                setFiles(data.files);
            })
            .catch(error => {
                console.error('Error:', error);
            })
            .finally(() => {
                setLoading(false);
            })
    }, [id, currentPath]);
    return (
        <main>
            <h1>File Explorer</h1>
            <p>Project ID: {id}</p>
            <button onClick={goBack}>Back</button>
            {Loading && <p>Loading files...</p>}
            {error && <p>{error}</p>}
            <p>Current Path: /{currentPath}</p>
            <button onClick={goUp} disabled={!currentPath}>⬆Parent Folder</button>
            
            <ul>
                {files.map((file) => (
                    <li key={file.path}>
                        {file.is_dir ?(
                            <button onClick={() => openFolder(file.name)}>📁 {file.name}</button>
                        ): (
                            <span>📄 {file.name}</span>
                        )}
                    </li>
                ))}
            </ul>
        </main>
    )
}

export default FileExplorer;