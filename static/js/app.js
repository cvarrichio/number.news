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
    const activeCardRef = useRef(null);
    const pinnedCardRef = useRef(null);

    const positionExpandedCard = card => {
        if (!card || window.innerWidth <= 768 || !card.classList.contains('is-expanded')) {
            return;
        }

        const panel = card.querySelector('.metric-panel');
        const sidebar = document.getElementById('site-sidebar');
        if (!panel) {
            return;
        }

        card.style.setProperty('--expand-x', '0px');
        card.style.setProperty('--expand-y', '0px');
        card.style.setProperty('--expand-scale', '1');

        const cardRect = card.getBoundingClientRect();
        const sidebarRect = sidebar?.getBoundingClientRect();
        const viewportMargin = 12;
        const safeLeft = sidebarRect && sidebarRect.right > 0
            ? sidebarRect.right + viewportMargin
            : viewportMargin;
        const safeRight = window.innerWidth - viewportMargin;
        const safeTop = viewportMargin;
        const safeBottom = window.innerHeight - viewportMargin;
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const availableWidth = Math.max(1, safeRight - safeLeft);
        const availableHeight = Math.max(1, safeBottom - safeTop);
        const scale = Math.min(
            1,
            availableWidth / panelWidth,
            availableHeight / panelHeight
        );
        const maxLeft = safeRight - panelWidth * scale;
        const maxTop = safeBottom - panelHeight * scale;
        const targetLeft = Math.min(Math.max(cardRect.left, safeLeft), maxLeft);
        const targetTop = Math.min(Math.max(cardRect.top, safeTop), maxTop);

        card.style.setProperty('--expand-x', `${targetLeft - cardRect.left}px`);
        card.style.setProperty('--expand-y', `${targetTop - cardRect.top}px`);
        card.style.setProperty('--expand-scale', scale);
    };

    const resetCard = card => {
        if (!card) {
            return;
        }

        card.classList.remove('is-expanded', 'is-pinned');
        card.setAttribute('aria-expanded', 'false');
        card.style.removeProperty('--expand-x');
        card.style.removeProperty('--expand-y');
        card.style.removeProperty('--expand-scale');

        const pinButton = card.querySelector('.metric-card__pin');
        if (pinButton) {
            pinButton.textContent = 'Pin';
            pinButton.setAttribute('aria-label', 'Keep this panel open');
        }

        if (activeCardRef.current === card) {
            activeCardRef.current = null;
        }
        if (pinnedCardRef.current === card) {
            pinnedCardRef.current = null;
        }
    };

    const expandCard = (card, { pinned = false } = {}) => {
        if (!card || window.innerWidth <= 768) {
            return;
        }

        if (pinnedCardRef.current && pinnedCardRef.current !== card) {
            resetCard(pinnedCardRef.current);
        }
        if (activeCardRef.current && activeCardRef.current !== card) {
            resetCard(activeCardRef.current);
        }

        activeCardRef.current = card;
        card.classList.add('is-expanded');
        card.setAttribute('aria-expanded', 'true');

        const pinButton = card.querySelector('.metric-card__pin');
        if (pinned) {
            pinnedCardRef.current = card;
            card.classList.add('is-pinned');
            if (pinButton) {
                pinButton.textContent = 'Close';
                pinButton.setAttribute('aria-label', 'Close this panel');
            }
        } else if (pinButton) {
            pinButton.textContent = 'Pin';
            pinButton.setAttribute('aria-label', 'Keep this panel open');
        }

        positionExpandedCard(card);
    };

    const collapseCard = (card, { force = false } = {}) => {
        if (!card || (!force && card.classList.contains('is-pinned'))) {
            return;
        }
        resetCard(card);
    };

    const togglePinnedCard = card => {
        if (card.classList.contains('is-pinned')) {
            collapseCard(card, { force: true });
        } else {
            expandCard(card, { pinned: true });
        }
    };

    const handleCardPointerEnter = event => {
        if (
            (event.pointerType === 'mouse' || event.pointerType === 'pen') &&
            window.matchMedia('(hover: hover)').matches &&
            !pinnedCardRef.current
        ) {
            expandCard(event.currentTarget);
        }
    };

    const handleCardPointerLeave = event => {
        const card = event.currentTarget;
        if (!card.contains(document.activeElement)) {
            collapseCard(card);
        }
    };

    const handleCardFocus = event => {
        const card = event.currentTarget;
        if (!pinnedCardRef.current || pinnedCardRef.current === card) {
            expandCard(card, { pinned: pinnedCardRef.current === card });
        }
    };

    const handleCardBlur = event => {
        if (
            !event.currentTarget.contains(event.relatedTarget) &&
            !event.currentTarget.matches(':hover')
        ) {
            collapseCard(event.currentTarget);
        }
    };

    const handleCardKeyDown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePinnedCard(event.currentTarget);
        } else if (event.key === 'Escape') {
            collapseCard(event.currentTarget, { force: true });
        }
    };

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

        const handleResize = () => {
            fitFixedWidthEmbeds();

            if (window.innerWidth <= 768) {
                collapseCard(activeCardRef.current, { force: true });
            } else {
                positionExpandedCard(activeCardRef.current);
            }
        };
        const handleScroll = () => positionExpandedCard(activeCardRef.current);

        fitFixedWidthEmbeds();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
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
                    <div className="metric-grid">
                        ${content.map(item => html`
                            <section key=${item.id}
                               id=${item.id}
                               className="metric-card"
                               tabIndex="0"
                               aria-expanded="false"
                               aria-label=${item.display_name || item.index_title || 'Data panel'}
                               onPointerEnter=${handleCardPointerEnter}
                               onPointerLeave=${handleCardPointerLeave}
                               onFocus=${handleCardFocus}
                               onBlur=${handleCardBlur}
                               onKeyDown=${handleCardKeyDown}>
                                <div className="metric-panel">
                                    <div className="metric-card__header">
                                        <div>
                                            <h2 className="title is-4">${item.display_name}</h2>
                                            ${item.description && html`
                                                <p className="metric-card__subtitle">${item.description}</p>
                                            `}
                                        </div>
                                        <button type="button"
                                           className="metric-card__pin"
                                           aria-label="Keep this panel open"
                                           onClick=${event => {
                                               event.stopPropagation();
                                               togglePinnedCard(event.currentTarget.closest('.metric-card'));
                                           }}>
                                            Pin
                                        </button>
                                    </div>
                                    <div className="widget" id=${`widget-${item.id}`}></div>
                                </div>
                                <button type="button"
                                   className="metric-card__touch-target"
                                   aria-label=${`Expand ${item.display_name || item.index_title || 'data panel'}`}
                                   onClick=${event => {
                                       const card = event.currentTarget.closest('.metric-card');
                                       togglePinnedCard(card);
                                       card.focus({ preventScroll: true });
                                   }}>
                                    Expand
                                </button>
                            </section>
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
