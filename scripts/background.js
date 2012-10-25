SoulKowo = {
    STATUS: {
        DISCONNECTED: 1,
        SOCKETOK: 2,
        WAITINGFORCONNECTION: 3,
        CONNECTING: 4,
        CONNECTED: 5
    },

    server_props: {
        server: 'ns-server.epita.fr',
        port: 4242,
    },

    user: {
        location: 'Uranus',
        client: 'SoulKowo 0.5',
        login: 'exampl_e',
        password: 'p4s5w0rD',
        remember: false,
        status: 1, //STATUS.DISCONNECTED,
    },

    auth_props: {
        hash: null,
        host: null,
        port: null,
    },

    socket: null,

    ui: null,

    rep: {
        '002': function(data) {
            if (SoulKowo.user.status == SoulKowo.STATUS.WAITINGFORCONNECTION) {
                SoulKowo.user.status = SoulKowo.STATUS.CONNECTING;
                SoulKowo.sendMessage(
                    "ext_user_log " + SoulKowo.user.login + " " +
                    Std.md5(SoulKowo.auth_props.hash + "-" + SoulKowo.auth_props.host + "/" + SoulKowo.auth_props.port + SoulKowo.user.password ) +
                    " " + encodeURIComponent(SoulKowo.user.location) + " " + encodeURIComponent(SoulKowo.user.client)
                );
            } else if (SoulKowo.user.status == SoulKowo.STATUS.CONNECTING) {
                SoulKowo.connected();
            }
        },
        '031': function(data) {
            SoulKowo.connected();
        },
        '033': function(data) {
            SoulKowo.user.status = SoulKowo.STATUS.DISCONNECTED;
            if (SoulKowo.ui) {
                SoulKowo.ui.error('Couldn\'t login');
                SoulKowo.ui.showContactList(false);
            }
        }
    },

    commands: {
        salut: function(data) { // salut ! suis-moi ! ok !
            if (data.length > 3) {
                SoulKowo.auth_props.hash = data[1];
                SoulKowo.auth_props.host = data[2];
                SoulKowo.auth_props.port = data[3];
                SoulKowo.sendMessage("auth_ag ext_user none none");
                SoulKowo.user.status = SoulKowo.STATUS.WAITINGFORCONNECTION;
            } else {
                console.error('salut parsing error');
            }
        },
        ping:  function(data) { // ping pong pong pong ping ping pong ping pong ping ping
            if (data.length > 0)
                SoulKowo.sendMessage('ping ' + data[0]);
            else
                console.error('ping parsing error');
        },
        rep: function(data) { // a sa
            if (SoulKowo.rep[data[0]])
                SoulKowo.rep[data.shift()](data);
            else
                console.error('rep command not found', data);
        },
        who: function(data) { // doctor

        },
        user_cmd: function(data) { // mxbo bigmac frites coca

        },
        state: function(data) {

        },
        dotnetSoul_UserTyping: function(data) {

        },
        dotnetSoul_UserCancelledTyping: function(data) {

        },
    },

    connected: function() {
        SoulKowo.user.status = SoulKowo.STATUS.CONNECTED;
        if (SoulKowo.ui) {
            SoulKowo.ui.showContactList(true);
            SoulKowo.ui.notice('User logged');
        }

        if (SoulKowo.user.remember) {
            chrome.storage.local.set({'remember': true, 'login': SoulKowo.user.login, 'password': SoulKowo.user.password}, function () {});
        } else {
            SoulKowo.disconnect(true);
        }
    },

    showChatWindow: function() {
        chrome.app.window.create('html/contactlist.html', {
            'defaultWidth': 400,
            'defaultHeight': 500,
            'type': 'shell',
        });
    },

    responseListener: function(data) {
        console.log('<<', data);
        data = data.split(' ');
        if (SoulKowo.commands[data[0]])
            SoulKowo.commands[data.shift()](data);
        else
            console.error('Command not found');
    },

    sendMessage: function(data) {
        SoulKowo.socket.sendMessage(data);
        console.log('>>', data);
    },

    connect: function(login, password, remember) {
        SoulKowo.user.login = login;
        SoulKowo.user.password = password;
        SoulKowo.user.remember = remember;
        SoulKowo.socket.connect();
    },

    disconnect: function(clearCredentials) {
        SoulKowo.socket.disconnect();
        SoulKowo.user.login = 'exampl_e';
        SoulKowo.user.password = 'p4s5w0rD';
        SoulKowo.user.remember = false;

        if (clearCredentials == true) {
            chrome.storage.local.set({'remember': false, 'login': 'exampl_e', 'password': 'p4s5w0rD'}, function () {});
        }
        SoulKowo.ui.showContactList(false);
    },

    setUi: function(ui) {
        SoulKowo.ui = ui;

        if (SoulKowo.user.status == SoulKowo.STATUS.CONNECTED) {
            ui.showContactList(true);
        }
    },

    init: function() {
        SoulKowo.socket = new TcpClient(SoulKowo.server_props.server, SoulKowo.server_props.port);
        SoulKowo.socket.addResponseListener(SoulKowo.responseListener);
        chrome.app.runtime.onLaunched.addListener(SoulKowo.showChatWindow);

        chrome.storage.local.get(['remember', 'login', 'password'], function(data) {
            if (data.remember && data.login && data.password) {
                SoulKowo.user.remember = true;
                SoulKowo.user.login = data.login;
                SoulKowo.user.password = data.password;
                SoulKowo.socket.connect();
            }
        });
    },
};

SoulKowo.init();