chrome.app.runtime.onLaunched.addListener(function() {
        chrome.app.window.create('html/contactlist.html', {
            'defaultWidth': 700,
            'minWidth': 700,
            'defaultHeight': 510,
            'type': 'shell',
        });
    });