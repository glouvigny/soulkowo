SoulKowo = {
    STATUS: {
        DISCONNECTED: 1,
        WAITINGFORCONNECTION: 2,
        CONNECTING: 3,
        CONNECTED: 4,
    },

    server_props: {
        server: 'ns-server.epita.fr',
        port: 4242,
    },

    user: {
        location: 'Uranus',
        client: 'SoulKowo - NetSoul in Chrome: http://llau.me/2B',
        login: 'exampl_e',
        password: 'p4s5w0rD',
        remember: false,
        status: 1, //STATUS.DISCONNECTED,
        connectionRetryTime: 1,
        connectionRetry: null,
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
                SoulKowo.notification('info', 'Connection to NetSoul');
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
            SoulKowo.notification('error', 'Couldn\'t login');
            if (SoulKowo.ui) {
                SoulKowo.ui.showContactList(true);
            }
        }
    },

    contactList: {
        contacts: {},
        addContact: function(login) {
            login = login.trim();
            if (SoulKowo.contactList.contacts[login] !== undefined)
                return;

            SoulKowo.contactList.contacts[login] = 'none';
            SoulKowo.contactList.updateContact();
            SoulKowo.notification('info', login + ' has been added to the contact list');
            if (SoulKowo.ui) {
                SoulKowo.ui.addContact(login);
            }
        },
        removeContact: function(login) {
            login = login.trim();
            if (SoulKowo.contactList.contacts[login] === undefined)
                return;

            delete SoulKowo.contactList.contacts[login];
            SoulKowo.contactList.updateContact();
            SoulKowo.notification('info', login + ' has been removed from the contact list');
            if (SoulKowo.ui) {
                SoulKowo.ui.removeContact(login);
            }
        },
        updateContact: function() {
            chrome.storage.local.set({'contacts': SoulKowo.contactList.contacts});
            SoulKowo.contactList.watchlog();
        },
        setStatus: function(login, status) {
            if (SoulKowo.contactList.contacts[login] === undefined)
                return;

            SoulKowo.contactList.contacts[login] = status;
            if (SoulKowo.ui) {
                SoulKowo.ui.user_status(login, status);
            }
        },
        watchlog: function() {
            var userlist = [];
            for (user in SoulKowo.contactList.contacts)
                userlist.push(user);
            SoulKowo.sendMessage("user_cmd watch_log_user {" + userlist.join(',') + "}");
            SoulKowo.sendMessage("user_cmd who {" + userlist.join(',') + "}");
        },
    },

    messaging: {
        history: {},
        addHistory: function(incoming, login, msg) {
            var time = new Date();
            if (!SoulKowo.messaging.history[login]) {
                SoulKowo.messaging.history[login] = [];
            }
            SoulKowo.messaging.history[login].push({incoming: incoming, time: time, msg: msg});
            SoulKowo.ui.messagesUpdate(login);
        },
        recvMessage: function(login, msg) {
            SoulKowo.messaging.addHistory(true, unescape(login), unescape(msg));
        },
        sendMessage: function(login, msg) {
            SoulKowo.messaging.addHistory(false, login, msg);
            SoulKowo.sendMessage('user_cmd msg_user ' + escape(login) + ' msg ' + escape(msg));
        },
    },

    user_cmds: {
        msg: function(login, data) {
            if (data[3])
                SoulKowo.messaging.recvMessage(login, data[3]);
        },
        logout: function(login, data) {
            SoulKowo.contactList.setStatus(login, 'none');
        },
        login: function(login, data) {
            SoulKowo.contactList.setStatus(login, 'actif');
        },
        state: function(login, data) {
            if (data[3])
                SoulKowo.contactList.setStatus(login, data[3].split(':')[0]);
        },
        who: function(login, data) {
            if (data.length < 15 || data[4] == '002')
                return;

            SoulKowo.contactList.setStatus(data[4], data[13].split(':')[0]);
        },
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
        who: function(data) {

        },
        user_cmd: function(data) { // mxbo bigmac frites coca
            if (data.length < 5)
                return;
            var user_info = data[0].split(':')
            if (user_info.length > 6) {
                var user_cred = user_info[3].split('@');
                if (user_cred.length > 1) {
                    if (SoulKowo.user_cmds[data[2]]) {
                        return SoulKowo.user_cmds[data[2]](user_cred[0], data);
                    }
                }
            }
        },
        state: function(data) {

        },
    },

    initConnectionCheck: function() {
        window.setTimeout(SoulKowo.initConnectionCheck, 10000);
        if (SoulKowo.socket && SoulKowo.socket.isConnected) {
            SoulKowo.commands.ping(["10"]);
        }
    },

    connectionCheck: function(data, cb) {
        if (SoulKowo.user.status == SoulKowo.STATUS.CONNECTED) {
            if (SoulKowo.socket.isConnected && data.bytesWritten > 0) {
                if (typeof cb == 'function')
                    cb(true, data);
                return;
            } else {
                SoulKowo.disconnect(false);
            }
        }
        if (typeof cb == 'function')
            cb(false, data);
    },

    connected: function() {
        SoulKowo.user.status = SoulKowo.STATUS.CONNECTED;
        SoulKowo.user.connectionRetryTime = 1;
        SoulKowo.sendMessage("state actif");
        SoulKowo.contactList.watchlog();
        window.clearTimeout(SoulKowo.user.connectionRetry);
        SoulKowo.notification('info', 'User logged');
        if (SoulKowo.ui) {
            SoulKowo.ui.showContactList(true);
        }

        if (SoulKowo.user.remember) {
            chrome.storage.local.set({'remember': true, 'login': SoulKowo.user.login, 'password': SoulKowo.user.password});
        } else {
            chrome.storage.local.set({'remember': false, 'login': 'exampl_e', 'password': 'p4s5w0rD'});
        }
    },

    showChatWindow: function() {
        chrome.app.window.create('html/contactlist.html', {
            'defaultWidth': 720,
            'minWidth': 720,
            'defaultHeight': 500,
            'type': 'shell',
        });
    },

    responseListener: function(raw) {

        raw = raw.split('\n');
        for (i in raw) {
            if (raw[i].trim()) {
                console.log('<<', raw[i]);
                data = raw[i].split(' ');
                if (raw[i] && data.length > 0) {
                    if (SoulKowo.commands[data[0]])
                        SoulKowo.commands[data.shift()](data);
                    else
                        console.error('Command not found');
                }
            }
        }
    },

    sendMessage: function(data, cb) {
        SoulKowo.socket.sendMessage(data, function(data) {
            SoulKowo.connectionCheck(data, cb);
        });
        if (data.substring(0, 4) !== 'ping')
            console.log('>>', data);
    },

    connect: function(login, password, remember) {
        SoulKowo.user.login = login;
        SoulKowo.user.password = password;
        SoulKowo.user.remember = remember;
        SoulKowo.socketConnection();
    },

    socketConnection: function() {
        clearTimeout(SoulKowo.user.connectionRetry);
        SoulKowo.socket.connect(function(resultCode) {
            if (resultCode < 0) {
                SoulKowo.disconnect(false);
            }
        });
    },

    disconnect: function(clearCredentials) {
        SoulKowo.socket.disconnect();
        SoulKowo.socket.isConnected = false;
        SoulKowo.user.status = SoulKowo.STATUS.DISCONNECTED;
        if (clearCredentials) {
            SoulKowo.user.login = 'exampl_e';
            SoulKowo.user.password = 'p4s5w0rD';
            SoulKowo.user.remember = false;

            chrome.storage.local.set({'remember': false, 'login': 'exampl_e', 'password': 'p4s5w0rD'});
            clearTimeout(SoulKowo.user.connectionRetry);
        } else {
            SoulKowo.user.connectionRetryTime = Math.min(2 * SoulKowo.user.connectionRetryTime, 60);
            SoulKowo.notification('error', 'Connection error. Retrying in ' + SoulKowo.user.connectionRetryTime + ' seconds');
            SoulKowo.user.connectionRetry = setTimeout(SoulKowo.socketConnection, SoulKowo.user.connectionRetryTime * 1000);
        }
        if (SoulKowo.ui) {
            SoulKowo.ui.showContactList(false);
        }
    },

    _chromeNotification: function(level, msg) {
        if (level == 'error') {
            level = 'Error:'
        } else if (level == 'info') {
            level = 'Info:'
        }

        var notification = webkitNotifications.createNotification(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkY3NEE2QzkyMDFBMTFFMkFBMjNBRUI3ODUzMzE3QjEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MkY3NEE2Q0EyMDFBMTFFMkFBMjNBRUI3ODUzMzE3QjEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyRjc0QTZDNzIwMUExMUUyQUEyM0FFQjc4NTMzMTdCMSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyRjc0QTZDODIwMUExMUUyQUEyM0FFQjc4NTMzMTdCMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PrNGom0AAA8ZSURBVHjazFoJkBTl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',
            level,
            msg
        );
        notification.ondisplay = function() {
            setTimeout(function() {
                notification.close();
            }, 3000);
        };
        notification.show();
    },

    notification: function(level, message) {
        var fct = null;
        if (SoulKowo.ui && SoulKowo.ui.alive()) {
            fct = SoulKowo.ui.notification;
        } else {
            fct = SoulKowo._chromeNotification;
        }
        if (fct != null) {
            fct(level, message);
        }
    },

    setUi: function(ui) {
        SoulKowo.ui = ui;

        if (SoulKowo.user.status == SoulKowo.STATUS.CONNECTED) {
            ui.showContactList(true);
            for (login in SoulKowo.contactList.contacts) {
                SoulKowo.ui.addContact(login);
                SoulKowo.ui.user_status(login, SoulKowo.contactList.contacts[login]);
            }
        }
    },

    init: function() {
        SoulKowo.socket = new TcpClient(SoulKowo.server_props.server, SoulKowo.server_props.port);
        SoulKowo.socket.addResponseListener(SoulKowo.responseListener);
        chrome.app.runtime.onLaunched.addListener(SoulKowo.showChatWindow);
        SoulKowo.initConnectionCheck();

        chrome.storage.local.get(['remember', 'login', 'password', 'contacts'], function(data) {
            if (data.remember && data.login && data.password) {
                SoulKowo.user.remember = true;
                SoulKowo.user.login = data.login;
                SoulKowo.user.password = data.password;
                SoulKowo.socketConnection();
            }
            if (data.contacts) {
                SoulKowo.contactList.contacts = data.contacts;
            }
        });
    },
};

SoulKowo.init();