import {useState, useEffect} from 'react'

function Dashboard() {
    const [status, setStatus] = useState("")
    useEffect(() =>{
        fetch('http://localhost:5000/api/health')
            .then(response => response.json())
            .then(data => setStatus(data.status))
    }, [])

    if (!status) {
        return <p>Loading...</p>
    } else {
        return (
        <body>
        <main>
            <h1>Dashboard</h1>
            <p>{status}</p>
        </main>
        </body>
        )
    } 
}
export default Dashboard