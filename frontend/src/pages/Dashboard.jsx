import { useNavigate } from 'react-router-dom';
import {useState, useEffect} from 'react';

function Dashboard() {
    const navigate = useNavigate();

    function openFiles(id) {
        console.log("Open Files")
        navigate(`/explorer/${id}`);
    }

    function AddProject(e) {
        e.preventDefault()
        console.log("Add Project")
        fetch('http://localhost:5000/api/projects/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: e.target.name.value,
                folder_path: e.target.folder_path.value,
                language: e.target.language.value,
                date: new Date().toISOString(),
                last_updated: new Date().toISOString()
            })
        })
            .then(response => {
                if (!response.ok) throw new Error('Add Project failed');
                return fetch('http://localhost:5000/api/projects/view');
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to load projects');
                return response.json();
            })
            .then(data => {
                setProjects(data.projects);
                setShowForm(false);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function deleteProject(id) {
        const confirmed = window.confirm("Are you sure you want to delete this project?");
        if (!confirmed) return;

        console.log("Delete Project")
        fetch('http://localhost:5000/api/projects/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: Number(id)
            })
        })
            .then(response => {
                if (!response.ok) throw new Error('Delete failed');

                setProjects(prev =>
                    prev.filter(project => project[0] !== Number(id))
                );
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    const [ShowForm, setShowForm] = useState(false)
    const [status, setStatus] = useState(null)
    useEffect(() =>{
        fetch('http://localhost:5000/api/health')
            .then(response => response.json())
            .then(data => setStatus(data.status))
            .catch(error => {
                console.error('Backend connection error:', error);
                setStatus('offline');
            })
    }, [])

    const [projects, setProjects] = useState([])
    useEffect(() => {
        fetch('http://localhost:5000/api/projects/view')
        .then(response => response.json())
        .then(data => setProjects(data.projects))
        .catch(error => {
            console.error('Failed to fetch projects:', error);
        })
    }, [])

    if (!status) {
        return <p>Loading...</p>
    } else {
        return (
        <main>
            <h1 className="dashboard-title">Dashboard</h1>
            <ul className='project-list'>
                {projects.map((project) => (
                    <li key={project[0]}>
                        <h2>{project[1]}</h2>
                        <p>{project[2]}</p>
                        <p>{project[3]}</p>
                        <p>Created: {project[4]}</p>
                        <p>Last Modified: {project[5]}</p>
                        <div className="project-actions">
                        <button className="delete-btn" onClick={() => deleteProject(project[0])}>Delete</button>
                        <button className="open-btn" onClick={() => openFiles(project[0])}>Open Files</button>
                        </div>
                    </li>))}
            </ul>

            <button onClick={() => setShowForm(true)}>Add Project</button>
            {ShowForm && (
                <form onSubmit={AddProject}>
                    <input type="text" name="name" placeholder="Project Name" required />
                    <input type="text" name="folder_path" placeholder="location" required />
                    <input type="text" name="language" placeholder="language" required />
                    <button type="submit">Submit</button>
                    <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                </form>
            )}
        </main>
        )
    }
}
export default Dashboard