const { useState, useEffect, useRef } = React;
const html = htm.bind(React.createElement);

const fixedWidthEmbeds = [
    { hostname: 'fred.stlouisfed.org', width: 670 },
    { hostname: 'www.meteoblue.com', width: 680 },
    { hostname: 'widgets.mortgagenewsdaily.com', width: 498 },
];

const fitFixedWidthEmbeds = () => {
    const isMobile = window.innerWidth <= 768;

    document.querySelectorAll('.widget iframe').forEach(iframe => {
        const source = iframe.getAttribute('src') || '';
        const embed = fixedWidthEmbeds.find(({ hostname }) => source.includes(hostname));

        if (!embed) {
            return;
        }

        const widget = iframe.closest('.widget');
        if (!widget) {
            return;
        }

        if (!isMobile) {
            if (iframe.hasAttribute('data-original-inline-style')) {
                const originalStyle = iframe.getAttribute('data-original-inline-style');

                if (originalStyle) {
                    iframe.setAttribute('style', originalStyle);
                } else {
                    iframe.removeAttribute('style');
                }

                iframe.removeAttribute('data-original-inline-style');
            }

            widget.style.removeProperty('height');
            widget.classList.remove('has-scaled-embed');
            return;
        }

        if (!iframe.hasAttribute('data-original-inline-style')) {
            iframe.setAttribute(
                'data-original-inline-style',
                iframe.getAttribute('style') || ''
            );
        }

        iframe.style.setProperty('width', `${embed.width}px`, 'important');
        iframe.style.setProperty('max-width', 'none', 'important');
        iframe.style.setProperty('transform', 'none', 'important');

        const scale = Math.min(1, widget.clientWidth / embed.width);
        const scaledHeight = Math.ceil(iframe.offsetHeight * scale);

        iframe.style.setProperty('transform', `scale(${scale})`, 'important');
        iframe.style.setProperty('transform-origin', 'top left', 'important');
        widget.style.height = `${scaledHeight}px`;
        widget.classList.add('has-scaled-embed');
    });
};

const App = () => {
    const [content, setContent] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const menuButtonRef = useRef(null);

    useEffect(() => {
        fetch('/api/content')
            .then(response => response.json())
            .then(setContent)
            .catch(error => console.error('Error fetching content:', error));
    }, []);

    useEffect(() => {
        // This effect runs after the content is rendered
        content.forEach(item => {
            const element = document.getElementById(`widget-${item.id}`);
            if (element) {
                // Insert the content
                element.innerHTML = item.content;

                // Find and execute any scripts
                const scripts = element.getElementsByTagName('script');
                Array.from(scripts).forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
        });

        fitFixedWidthEmbeds();
        window.addEventListener('resize', fitFixedWidthEmbeds);

        return () => window.removeEventListener('resize', fitFixedWidthEmbeds);
    }, [content]);

    useEffect(() => {
        if (!isActive) {
            return undefined;
        }

        const closeOnEscape = event => {
            if (event.key === 'Escape') {
                setIsActive(false);
                menuButtonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [isActive]);

    const closeSidebar = () => setIsActive(false);
    const toggleSidebar = () => setIsActive(active => !active);

    return html`
        <div>
            <nav className="navbar is-light" role="navigation" aria-label="main navigation">
                <div className="container">
                    <div className="navbar-brand">
                        <button type="button"
                           ref=${menuButtonRef}
                           className=${`navbar-burger ${isActive ? 'is-active' : ''}`}
                           aria-label=${isActive ? 'Close menu' : 'Open menu'}
                           aria-expanded=${isActive}
                           aria-controls="site-sidebar"
                           onClick=${toggleSidebar}>
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                        </button>
                    </div>

                </div>
            </nav>

            <div id="site-sidebar" className=${`sidebar ${isActive ? 'is-active' : ''}`}>
                <aside className="menu">
                    <a className="menu-label" href="/">News by the Numbers</a>
                    <ul className="menu-list">
                        ${content.map(item => item.index_title && html`
                            <li key=${item.id}>
                                <a href="#${item.id}" onClick=${closeSidebar}>
                                    ${item.index_title}
                                </a>
                            </li>
                        `)}
                        <a href='https://sota.technology/' target="_blank" rel="noopener noreferrer">${"→"}Machine Learning SOTA</a>
                    </ul>
                    
                </aside>
            </div>

            <div className="main-content">
                    <div className="container">
                        ${content.map(item => html`
                            <div key=${item.id} id=${item.id} className="content">
                            <div className="header">
                                 <h2 className="title is-4">${item.display_name}</h2>
                                 ${item.description && html`<p className="subtitle">${item.description}</p>`}
                            </div>
                                <div className="widget" id=${`widget-${item.id}`}></div>
                            </div>
                        `)}
                    </div>
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
