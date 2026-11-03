import { useParams } from "react-router-dom";
import { useState, useEffect, use } from "react";

function FileExplorer() {
    const { id } = useParams();
    const [files, setFiles] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:5000/api/projects/${id}/files`)
        .then(response => response.json())
        .then(data => setFiles(data))
    })
    return (
        <main>
            <h1>File Explorer</h1>
            <p>Project ID: {id}</p>
        </main>
    )
}

export default FileExplorer;