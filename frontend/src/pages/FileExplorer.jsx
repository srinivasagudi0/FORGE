import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function FileExplorer() {
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [Loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    function goBack() {
        navigate(-1);
    }



    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:5000/api/projects/${id}/files`)
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
    }, [id]);
    return (
        <main>
            <h1>File Explorer</h1>
            <p>Project ID: {id}</p>
            <button onClick={goBack}>Back</button>
            {Loading && <p>Loading files...</p>}
            {error && <p>{error}</p>}
            <ul>
                {files.map((file) => (
                    <li key={file.path}>
                        {file.is_dir ? "📁" : "📄"} {file.name}
                    </li>
                ))}
            </ul>
        </main>
    )
}

export default FileExplorer;