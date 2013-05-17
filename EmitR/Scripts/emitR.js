var emitR = function () {
    var events = {};
    var maxListeners = 10;
    var hub = $.connection.emitRHub;
    hub.client.emit = function () {
        this.serverEmit = true;
        emitR.emit.apply(this, [arguments[0]].concat(arguments[1]));
    };
    var ready = false;
    var initializing = false;    

    var init = function () {
        var $deferred = $.Deferred();
        if (!initializing && !ready) {
            initializing = true;
            $.connection.hub.start()
                .done(
                function () {
                    emitR.ready = true;
                    emitR.initializing = false;                    
                    $deferred.resolve();
                })
                .fail(
                function () {
                    emitR.ready = false;
                    emitR.initializing = false;
                    $deferred.fail();
                }
            );
        }
        if (emitR.ready) return $deferred.resolve();
        return $deferred.promise();
    };

    var setMaxListeners = function (n) {
        if (typeof n !== 'number' || n < 0)
            throw TypeError('n must be a positive number');
        maxListeners = n;
        return this;
    };

    var emit = function (type) {
        var handler, len, args, i, listeners;

        if (!events)
            events = {};

        handler = events[type];

        if (typeof handler === 'undefined')
            return false;

        if (typeof handler === 'function') {
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                    // slower
                default:
                    len = arguments.length;
                    args = new Array(len - 1);
                    for (i = 1; i < len; i++)
                        args[i - 1] = arguments[i];
                    handler.apply(this, args);
            }
        } else if (typeof handler === 'object') {
            len = arguments.length;
            args = new Array(len - 1);
            for (i = 1; i < len; i++)
                args[i - 1] = arguments[i];

            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++)
                listeners[i].apply(this, args);
        }
        
        if(!this.serverEmit) hub.server.emit(arguments[0], Array.prototype.slice.call(arguments, 1));
        return true;
    };

    var addListener = function (type, listener) {
        var $deferred = $.Deferred();

        if (typeof listener !== 'function')
            return $deferred.reject('listener must be a function');

        if (!events)
            events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener)
            emit('newListener', type, typeof listener.listener === 'function' ?
                listener.listener : listener);

        if (!events[type])
            // Optimize the case of one listener. Don't need the extra array object.
            events[type] = listener;
        else if (typeof events[type] === 'object')
            // If we've already got an array, just append.
            events[type].push(listener);
        else
            // Adding the second element, need to change to array.
            events[type] = [events[type], listener];

        // Check for listener leak
        if (typeof events[type] === 'object' && !events[type].warned) {
            if (maxListeners && maxListeners > 0 && events[type].length > maxListeners) {
                events[type].warned = true;
                if (typeof console === "undefined" || typeof console.log === "undefined") {
                } else {
                    console.log('(emitR) warning: possible emitR memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitR.setMaxListeners() to increase limit.',
                        events[type].length);
                }
            }
        }

        // Subscribe to type notifications
        return hub.server.subscribe(type);
    };

    var once = function (type, listener) {
        if (typeof listener !== 'function')
            return $.Deferred().reject('listener must be a function');

        function g() {
            removeListener(type, g);
            listener.apply(this, arguments);
        }

        g.listener = listener;
        return addListener(type, g);
    };

    // emits a 'removeListener' event if the listener was removed
    var removeListener = function (type, listener) {
        var list, position, length, i, serverSub;
        var $deferred = $.Deferred();

        if (typeof listener !== 'function')
            return $deferred.reject('listener must be a function');

        if (!events || !events[type])
            return $deferred.resolve();

        list = events[type];
        length = list.length;
        position = -1;

        if (list === listener ||
            (typeof list.listener === 'function' && list.listener === listener)) {
            events[type] = undefined;
            serverSub = true;
            if (events.removeListener)
                emit('removeListener', type, listener);

        } else if (typeof list === 'object') {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0)
                return $deferred.resolve();

            if (list.length === 1) {
                list.length = 0;
                events[type] = undefined;
                serverSub = true;
            } else {
                list.splice(position, 1);
            }

            if (events.removeListener)
                emit('removeListener', type, listener);
        }

        if (serverSub) {
            // unsubscribe from type notifications
            return hub.server.unsubscribe(type);
        } else {
            return $deferred.resolve();
        }
    };

    var removeAllListeners = function (type) {
        var key, listeners;

        if (!events)
            return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
            if (arguments.length === 0)
                events = {};
            else if (events[type])
                events[type] = undefined;
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            for (key in events) {
                if (key === 'removeListener') continue;
                removeAllListeners(key);
            }
            removeAllListeners('removeListener');
            events = {};
            return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
            removeListener(type, listeners);
        } else {
            while (listeners.length)
                removeListener(type, listeners[listeners.length - 1]);
        }
        events[type] = undefined;

        return this;
    };

    var listeners = function (type) {
        var ret;
        if (!events || !events[type])
            ret = [];
        else if (typeof events[type] === 'function')
            ret = [events[type]];
        else
            ret = events[type].slice();
        return ret;
    };

    var listenerCount = function (type) {
        var ret;
        if (!events || !events[type])
            ret = 0;
        else if (typeof events[type] === 'function')
            ret = 1;
        else
            ret = events[type].length;
        return ret;
    };

    return {
        init: init,
        ready: ready,
        on: addListener,
        once: once,
        addListener: addListener,
        off: removeListener,
        removeListener: removeListener,
        removeAllListeners: removeAllListeners,
        emit: emit,
        listeners: listeners,
        listenerCount: listenerCount,
        setMaxListeners: setMaxListeners
    };
}();


