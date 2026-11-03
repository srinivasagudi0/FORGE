import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function FileExplorer() {
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [Loading, setLoading] = useState(true);



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
            .finally(() => {})
                setLoading(false);
            }, [])
    return (
        <main>
            <h1>File Explorer</h1>
            <p>Project ID: {id}</p>
            <button onClick={goBack}>Back</button>
            {Loading && <p>Loading files...</p>}
            {error && <p>{error}</p>}
            
        </main>
    )
}

export default FileExplorer;