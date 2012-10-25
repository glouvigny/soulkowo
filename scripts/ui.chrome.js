var SoulKowoUi = {
    init: function() {
        document.querySelector('#login-connect').addEventListener("click", SoulKowoUi._connect);
        document.querySelector('#notice').addEventListener("click", SoulKowoUi._noticeHide);
        document.querySelector('#disconnect').addEventListener("click", SoulKowoUi._disconnect);
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

    _disconnect: function(e) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.window.SoulKowo.disconnect(true);
        });
    },

    _noticeHide: function() {
        if (window == null)
            return;

        Std.addClass(document.querySelector('#notice'), 'smooth-hide');
    },

    _noticeDisplay: function(msg, c) {
        if (window == null)
            return;

        var e = document.querySelector('#notice');
        Std.removeClass(e, 'smooth-hide');
        Std.removeClass(e, 'alert-error');
        Std.removeClass(e, 'alert-info');
        Std.addClass(e, c);
        document.querySelector('#notice-msg').innerText = msg;
        window.setTimeout(SoulKowoUi._noticeHide, 4200);
    },

    user_status: function(login, status) {

    },

    user_message: function(login, msg) {

    },

    showContactList: function(enabled) {
        if (window == null)
            return;

        var shown = enabled ? "#contact-list" : "#login-form";
        var hidden = enabled ? "#login-form" : "#contact-list";

        Std.removeClass(document.querySelector(shown), 'hide');
        Std.addClass(document.querySelector(hidden), 'hide');
    },

    error: function(msg) {
        SoulKowoUi._noticeDisplay(msg, 'alert-error');
    },

    notice: function(msg) {
        SoulKowoUi._noticeDisplay(msg, 'alert-info');
    },
}

SoulKowoUi.init();