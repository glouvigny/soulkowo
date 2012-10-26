var SoulKowoUi = {
    notificationTimeout: 0,

    init: function() {
        document.querySelector('#login-connect').addEventListener("click", SoulKowoUi._connect);
        document.querySelector('#login-connect-stop').addEventListener("click", SoulKowoUi._stopConnect);
        document.querySelector('#notice').addEventListener("click", SoulKowoUi._noticeHide);
        document.querySelector('#disconnect').addEventListener("click", SoulKowoUi._disconnect);
        document.querySelector('#add-contact-button').addEventListener("click", SoulKowoUi._addContact);
        document.querySelector('#add-contact-form').addEventListener("submit", SoulKowoUi._addContact);
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.setUi(SoulKowoUi);
        });
    },

    _connect: function(e) {
        e.preventDefault();
        var remember = document.querySelector('#login-remember').checked;
        var login = document.querySelector('#login-login').value;
        var password = document.querySelector('#login-password').value;
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.connect(login, password, remember);
        });
    },

    _stopConnect: function(e) {
        e.preventDefault();
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.disconnect(true);
        });
    },

    _disconnect: function(e) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.disconnect(true);
        });
    },

    _noticeHide: function() {
        if (!SoulKowoUi.alive())
            return;

        Std.addClass(document.querySelector('#notice'), 'smooth-hide');
    },

    _addContact: function(e) {
        e.preventDefault();
        var login = document.querySelector('#add-contact-login').value;
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.contactList.addContact(login);
        });
    },

    _removeContact: function(e) {
        var login = e.target.parentNode.id;
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.contactList.removeContact(login);
        });
    },

    _toggleConversation: function(e) {
        var login = e.target.parentNode.id;
        if (!login)
            return;
        console.log(e);
        var convs = document.querySelectorAll('.contact-messages-box');
        for (i in convs) {
            Std.addClass(convs[i], 'hide');
        }

        var logins = document.querySelectorAll('#contact-list tr');
        for (i in convs) {
            Std.removeClass(logins[i], 'selected');
        }

        var conv = document.querySelector('#' + login + '-messages');
        var login = document.querySelector('#' + login);
        Std.removeClass(conv, 'hide');
        Std.addClass(login, 'selected');
    },

    notification: function(level, msg) {
        if (!SoulKowoUi.alive())
            return;

        var e = document.querySelector('#notice');
        Std.removeClass(e, 'smooth-hide');
        Std.removeClass(e, 'alert-error');
        Std.removeClass(e, 'alert-info');
        Std.addClass(e, 'alert-' + level);
        document.querySelector('#notice-msg').innerText = msg;
        window.clearTimeout(SoulKowoUi.notificationTimeout);
        SoulKowoUi.notificationTimeout = window.setTimeout(SoulKowoUi._noticeHide, 4200);
    },

    addContact: function(login) {
        if (!login || document.querySelector('#' + login))
            return;
        var new_contact = document.querySelector('#contact-placeholder').cloneNode(true);
        new_contact.id = login;
        new_contact.addEventListener("click", SoulKowoUi._toggleConversation);
        new_contact.querySelector('.contact-login').innerText = login;
        Std.removeClass(new_contact, 'hide');
        new_contact.querySelector('.contact-delete').addEventListener("click", SoulKowoUi._removeContact);
        document.querySelector('#contact-list').appendChild(new_contact);

        var new_contact_messages = document.querySelector('#contact-placeholder-messages').cloneNode(true);
        new_contact_messages.id = login + '-messages';
        document.querySelector('#message-boxes').appendChild(new_contact_messages);
    },

    removeContact: function(login) {
        if (!login)
            return;

        var elt = document.querySelector('#' + login);
        var elt2 = document.querySelector('#' + login + '-messages');
        if (!elt && !elt2)
            return;
        document.querySelector('#contact-list').removeChild(elt);
        document.querySelector('#contact-list').removeChild(elt2);
    },

    user_status: function(login, status) {
        if (!login)
            return;
        var user = document.querySelector('#' + login);
        if (!user)
            return;

        var statuses = user.querySelectorAll('.contact-status span');
        for (i in statuses)
            Std.addClass(statuses[i], 'hide');
        var status_label = user.querySelector('.status-' + status);
        if (status_label)
            Std.removeClass(status_label, 'hide');
    },

    user_message: function(login, msg) {

    },

    showContactList: function(enabled) {
        if (!SoulKowoUi.alive())
            return;

        var shown = enabled ? "#contact-list-container" : "#login-form";
        var hidden = enabled ? "#login-form" : "#contact-list-container";

        Std.removeClass(document.querySelector(shown), 'hide');
        Std.addClass(document.querySelector(hidden), 'hide');
        chrome.runtime.getBackgroundPage(function(bg) {
            for (login in bg.SoulKowo.contactList.contacts)
                SoulKowoUi.addContact(login);
        });
    },

    alive: function(msg) {
        return window !== null;
    }
}

SoulKowoUi.init();