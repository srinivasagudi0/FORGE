function Insights() {

    function goBack() {
        window.history.back();
    }

    return (
        <main>
            <div className="header">
                <h1>Insights</h1>
                <button onClick={goBack}>Back</button>
            </div>
        </main>
    )
}

export default Insights;
