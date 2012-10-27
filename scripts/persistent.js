var Persistent = {
    get: function(indexes, cb) {
        chrome.storage.local.get(indexes, function(data) {
            if (cb !== undefined) {
                cb(data);
            }
        });
    },

    set: function(data, cb) {
        chrome.storage.local.set(data, function(callback_data) {
            if (cb !== undefined) {
                cb(callback_data);
            }
        });
    }
}