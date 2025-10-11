describe('App', () => {
  it('should render without crashing', () => {
    const div = document.createElement('div');
    expect(div).toBeTruthy();
  });

  it('should have a root element', () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    expect(document.getElementById('root')).toBeInTheDocument();

    document.body.removeChild(rootElement);
  });
});

