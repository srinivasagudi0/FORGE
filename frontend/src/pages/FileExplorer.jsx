import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function FileExplorer() {
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [Loading, setLoading] = useState(true);

    

    setLoading(false);

    useEffect(() => {
        fetch(`http://localhost:5000/api/projects/${id}/files`)
        .then(response => response.json())
        .then(data => setFiles(data))
    })
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

export default FileExplorer;q