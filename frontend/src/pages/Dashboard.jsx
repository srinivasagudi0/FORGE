import {useState, useEffect} from 'react'

function Dashboard() {
    const [status, setStatus] = useState("")
    useEffect(() =>{
        fetch('http://localhost:5000/api/health')
            .then(response => response.json())
            .then(data => setStatus(data.status))
    }, [])

    const [projects, setProjects] = useState([])
    useEffect(() => {
        fetch('http://localhost:5000/api/projects/view')
        .then(response => response.json())
        .then(data => setProjects(data.projects))
    }, [])

    if (!status || !projects) {
        return <p>Loading...</p>
    } else {
        return (
        <body>
        <main>
            <h1>Dashboard</h1>
            <p>{status}</p>
            <ul>
                {projects.map((project) => (
                    <li key={project[0]}>
                        <h2>{project[1]}</h2>
                        <p>{project[2]}</p> 
                        <p>{project[3]}</p>
                        <p>{project[4]}</p>
                        <p>{project[5]}</p>

                        
                    </li>
                ))}

            </ul>
        </main>
        </body>
        )
    } 
}
export default Dashboard