import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import {FitAddon} from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useRef } from "react";
import "./FileExplorer.css"

function FileExplorer() {
    const { id } = useParams();
    const terminalRef = useRef(null);    
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
        if (!command.trim() || !Socket.current?.connected) return;
        Socket.current.emit("terminal_input", {
            input: command + "\n"
        });
        setCommand("");
    }

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: {background: "#111111", foreground: "#ffffff"}
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        terminal.open(terminalRef.current);
        fitAddon.fit();

        const connection = io("http://localhost:5000");
        Socket.current = connection;

        connection.on("connect", () => {
            connection.emit("terminal_start", {
                project_id: Number(id)
            });
        });

        connection.on("terminal_output", (data) => {
            terminal.write(data.output);
        });

        terminal.onData((input) => {
            connection.emit("terminal_input", {
                input: input
            });
        });

        return () => {
            connection.disconnect();
            terminal.dispose();
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
            <main className="forge-explorer">
            <div className="forge-shell">

                <header className="forge-header">
            <div>
                <span className="forge-eye">✦ YOUR DEV WORKSPACE</span>
                <h1>File Explorer <span>✦</span></h1>
                <p>Manage your project, edit files, and run commands.</p>
            </div>
            <div className="forge-header-actions">
                <span className="forge-id">Project #{id}</span>
                <button
                className="forge-btn purple"
                onClick={goBack}
                >
                ← Dashboard</button>
                <button
                className="forge-btn green"
                onClick={() => navigate(`/insights/${id}`)}
                >
                Insights</button>
            </div>
            
                </header>

            <section className="forge-path">
                <div className="current-location">
                <span>CURRENT LOCATION</span>
                <code>/{currentPath || ""}</code>
                </div>
                <button
                    className="forge-btn yellow"
                    onClick={goUp}
                    disabled={!currentPath}
                >
                    ↑ Go Up
                </button>
            </section>
            
            <div className="forge-workspace">
                <section className="forge-panel forge-files">
                <div className="forge-panel-header">
                    <h2>Project Files</h2>
                    <span className="forge-count">
                    {files.length} items
                    </span>
                </div>
                {Loading && <p>Loading files...</p>}
                {error && <p className="forge-error">{error}</p>}
                {!Loading && files.length === 0 && (
                <p className="forge-empty-files">This folder is empty.</p>
                )}
                <ul className="forge-file-list">
                {files.map((file) => (
                <li key={file.path}>
                    <button
                        className={
                        "forge-file-item " +
                        (file.is_dir ? "folder" : "file") +
                        (selectedFile === file.path ? " selected" : "")
                        }
                        onClick={() =>
                        file.is_dir
                        ? openFolder(file.name)
                        : openFile(file)
                    }>
                    <span className="forge-file-icon">{file.is_dir ? "📁" : "📄"}</span>
                    <span className="forge-file-name">{file.name}</span>
                    <span className="forge-file-arrow">→</span>
                    </button>
                </li>
                ))}
                </ul>
            </section>
            <section className="forge-panel forge-editor">
                <div className="forge-panel-header">
                    <h2>✏ File Editor</h2>
                    <span className="forge-tag">EDITOR</span>
                </div>
                {selectedFile ? (
                    <div className="forge-editor-content">
                        <div className="forge-open-file">
                            <span>📝</span>
                            <strong>{selectedFile}</strong>
                        </div>
                    <textarea
                        className="forge-code-input"
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        spellCheck={false}
                    />
                    {fileError && (
                    <p className="forge-error">{fileError}</p>
                    )}
                    <div className="forge-editor-actions">
                        <button
                        className="forge-btn yellow"
                        onClick={() => setSelectedFile(null)}
                        >
                        Close
                        </button>
                        <button
                        className="forge-btn green"
                        onClick={saveFile}
                        >
                            🆕 Save File
                        </button>
                    </div>
                    </div>
                    ) : (
                    <div className="forge-empty-editor">
                    <div className="forge-empty-icon">🚫</div>
                        <h3>Nothing open yet!</h3>
                        <p>Select a file to start editing.</p>
                    </div>
                    )}
                </section>
            </div>
            <section className="forge-panel forge-terminal-panel">
            <div className="forge-panel-header">
                <div className="forge-terminal-heading">
                    <span className="forge-live-dot"></span>
                    <h2>FORGE Terminal</h2>
                </div>
                <button
                    className="forge-btn red"
                    onClick={() => {
                    Socket.current?.emit("terminal_input", {
                        input: "\x03"
                    });
                    }}
                >
                ■ Stop Command
                </button>
            </div>
            <div className="forge-terminal-window">
                <div className="forge-terminal-top">
                    <div className="forge-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>zsh — FORGE</span>
                </div>
                <div
                className="forge-terminal-screen"
                ref={terminalRef}
                />
            </div>
            <p className="forge-terminal-tip">
            Tip: Click inside the terminal to type commands.
            </p>
            </section>
            </div>
            </main>
        );
    }
export default FileExplorer;