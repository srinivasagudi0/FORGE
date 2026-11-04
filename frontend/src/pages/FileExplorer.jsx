import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useRef } from "react";

function FileExplorer() {
    const { id } = useParams();
    const Socket = useRef(null);
    const [files, setFiles] = useState([]);
    const [Loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [currentPath, setCurrentPath] = useState("");

    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const[fileError, setFileError] = useState("");

    const [command, setCommand] = useState("");
    const [terminalOutput, setTerminalOutput] = useState("");
    const [terminalLoading, setTerminalLoading] = useState(false);

    function goBack() {
        navigate(-1);
    }

    async function runCommand() {
        if (!command.trim()) return;
        Socket.current.emit("terminal_command", {
            input: command + "\n"
        });
        setCommand("");
    }

    useEffect(() => {
        const connection = io("http://localhost:5000");
        Socket.current = connection;

        connection.on("connect", () => {
            connection.emit("terminal_start",{
                project_id: Number(id)
            });
        });
        connection.on("terminal_output", (data) => {
            setTerminalOutput((prevOutput) => prevOutput + data);
        });
        return () => {
            connection.disconnect();
            Socket.current = null;
        };
    }, [id]);

    async function openFile(file) {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${id}/file?path=${encodeURIComponent(file.path)}`);
            if (!response.ok) {
                throw new Error('Failed to load file content');
            }
            const data = await response.json();
            setSelectedFile(data.path);
            setFileContent(data.content);
        } catch (error) {
            console.error('Error:', error);
            setFileError(error.message);
        }
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

    async function saveFile() {
        if (!selectedFile) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/projects/${id}/file/save`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        path: selectedFile,
                        content: fileContent
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to save file");
            }

            alert("File saved successfully!");

    } catch (error) {
        alert(error.message);
    }
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
            {fileError && <p>{fileError}</p>}
            <p>Current Path: /{currentPath}</p>
            <button onClick={goUp} disabled={!currentPath}>⬆Parent Folder</button>
            {selectedFile && (
                <section className="file-preview">
                    <h2>{selectedFile}</h2>
                    <button onClick={()=> setSelectedFile(null)}>Close File</button>
                    <button onClick={saveFile}>Save File</button>
                    {fileError && <p>{fileError}</p>}
                    <textarea
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        spellCheck="false"
                        rows={20}
                        />
                </section>
            )}
           
            <ul>
                {files.map((file) => (
                    <li key={file.path}>
                        {file.is_dir ?(
                            <button onClick={() => openFolder(file.name)}>📁 {file.name}</button>
                        ): (
                            <button onClick={() => openFile(file)}>📄 {file.name}</button>
                        )}
                    </li>
                ))}
            </ul>
            <section className="terminal-panel">
                <h2>FORGE Terminal</h2>

                <div className="terminal-ouput">
                    <pre>{terminalOutput || "FORGE Terminal — Ready"}</pre>
                    <input
                        type="text"
                        placeholder="Enter a command..."
                        value={command}
                        onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { runCommand(); } }}
                    />
                    <button
                        onClick={runCommand}>
                            {terminalLoading ? "Running..." : "Run Command"}
                    </button>
                </div>
            </section>
        </main>
    )
}

export default FileExplorer;