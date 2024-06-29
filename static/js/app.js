const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

// Layout component
const Layout = ({ children }) => html`
  <div className="layout">
    <header>
      <h1>News by the Numbers</h1>
    </header>
    <main>${children}</main>
    <footer>© 2024 News by the Numbers</footer>
  </div>
`;

// Sidebar component
const Sidebar = ({ content }) => html`
  <nav className="nav nav-sidebar sidebar">
    <div className="sidenav sidebar">
      <ul className="nav flex-column">
        ${Array.isArray(content) && content.map(item => item.index_title && html`
          <li key=${item.id} className="nav-item">
            <a className="nav-link active" href="#${item.id}">
              ${item.index_title}
            </a>
          </li>
        `)}
      </ul>
    </div>
  </nav>
`;

// Content component
const Content = ({ content }) => html`
  <div className="container-fluid">
    <div className="row">
      <div className="col">
        <div className="panel-group content" id="accordion">
          ${Array.isArray(content) && content.map(item => html`
            <div key=${item.id} className="panel panel-default" id=${item.id}>
              <div className="panel-heading card-header" 
                   role="tab" 
                   onClick=${() => document.getElementById(`collapse${item.id}`).classList.toggle('show')}>
                <h4 className="panel-title">
                  <a role="button">${item.display_name}</a>
                </h4>
              </div>
              <div id=${`collapse${item.id}`} 
                   className=${`panel-collapse collapse ${item.default_open ? 'show' : ''}`} 
                   role="tabpanel">
                <div className="panel-body">
                  ${item.description && html`<p>${item.description}</p>`}
                  <div dangerouslySetInnerHTML=${{ __html: item.content }} />
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

// Main App component
function App() {
  const [content, setContent] = useState([]);

  useEffect(() => {
    fetch('/api/content')
      .then(response => response.json())
      .then(data => setContent(data))
      .catch(error => console.error('Error fetching content:', error));
  }, []);

  return html`
    <${Layout}>
      <${Sidebar} content=${content} />
      <${Content} content=${content} />
    <//>
  `;
}

ReactDOM.render(html`<${App} />`, document.getElementById('root'));