const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

const App = () => {
    const [content, setContent] = useState([]);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        fetch('/api/content')
            .then(response => response.json())
            .then(setContent)
            .catch(error => console.error('Error fetching content:', error));
    }, []);

    const toggleSidebar = () => setIsActive(!isActive);

    return html`
        <div>
            <nav className="navbar is-light" role="navigation" aria-label="main navigation">
                <div className="container">
                    <div className="navbar-brand">
                        <a role="button" 
                           className=${`navbar-burger ${isActive ? 'is-active' : ''}`}
                           aria-label="menu" 
                           aria-expanded="false" 
                           onClick=${toggleSidebar}>
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                        </a>
                    </div>
                </div>
            </nav>

            <div className=${`sidebar ${isActive ? 'is-active' : ''}`}>
                <aside className="menu">
                    <a className="menu-label" href="/">News by the Numbers</a>
                    <ul className="menu-list">
                        ${content.map(item => item.index_title && html`
                            <li key=${item.id}>
                                <a href="#${item.id}" onClick=${() => setIsActive(false)}>
                                    ${item.index_title}
                                </a>
                            </li>
                        `)}
                    </ul>
                </aside>
            </div>

            <div className="main-content">
                <section className="section">
                    <div className="container">
                        ${content.map(item => html`
                            <div key=${item.id} id=${item.id} className="content">
                                <h2 className="title is-4">${item.display_name}</h2>
                                ${item.description && html`<p className="subtitle">${item.description}</p>`}
                                <div dangerouslySetInnerHTML=${{ __html: item.content }} />
                            </div>
                        `)}
                    </div>
                </section>
                <footer className="footer">
                    <div className="container">
                        <div className="content has-text-centered">
                            <p><small>© 2024 News by the Numbers</small></p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    `;
};

ReactDOM.render(html`<${App} />`, document.getElementById('root'));