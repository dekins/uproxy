var popup_listeners = {};

//freedom.on('buddylist-update', function (msg) {
//  buddies = msg;
//});
//
function clearPopupListeners() {
  popup_listeners = [];
}

function addPopupListener(type, func) {
  if (popup_listeners[type]) {
    popup_listeners[type].push(func);
  } else {
    popup_listeners[type] = [func];
  }
}

function callPopupListener(type, data) {
  if (popup_listeners[type]) {
    for (var i = 0; i < popup_listeners[type].length; i++) {
      popup_listeners[type][i](data);
    }
  } else {
    console.log('Handler missing for: ' + type);
  }
}

freedom.on('id', function(msg) {
  callPopupListener('id', msg);
});

freedom.on('message-update', function (msg) {
  callPopupListener('message-update', msg);
  console.log('new message: '+msg);
});


freedom.emit('open-extension', '');
