const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

const App = () => {
    const [content, setContent] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        fetch('/api/content')
            .then(response => response.json())
            .then(setContent)
            .catch(error => console.error('Error fetching content:', error));

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsActive(!isActive);

    return html`
        <div className="container-fluid">
            <nav>
                <ul>
                    <li><strong>News by the Numbers</strong></li>
                </ul>
                ${isMobile && html`
                    <ul>
                        <li>
                            <a href="#" role="button" className="secondary outline" onClick=${toggleSidebar}>
                                ☰
                            </a>
                        </li>
                    </ul>
                `}
            </nav>

            <div className="grid">
                <aside className=${`sidebar ${isMobile && isActive ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}>
                    <nav>
                        <ul>
                            ${content.map(item => item.index_title && html`
                                <li key=${item.id}>
                                    <a href="#${item.id}" onClick=${() => isMobile && setIsActive(false)}>
                                        ${item.index_title}
                                    </a>
                                </li>
                            `)}
                        </ul>
                    </nav>
                </aside>

                <main className="container">
                    ${content.map(item => html`
                        <article key=${item.id} id=${item.id}>
                            <header>
                                <h2>${item.display_name}</h2>
                                ${item.description && html`<p>${item.description}</p>`}
                            </header>
                            <div dangerouslySetInnerHTML=${{ __html: item.content }} />
                        </article>
                    `)}
                </main>
            </div>

            <footer>
                <small>© 2024 News by the Numbers</small>
            </footer>
        </div>
    `;
};

ReactDOM.render(html`<${App} />`, document.getElementById('root'));