import { useParams } from "react-router-dom";

function FileExplorer() {
    const { id } = useParams();

    return (
        <main>
            <h1>File Explorer</h1>
            <p>Project ID: {id}</p>
        </main>
    )
}