describe("emitR", function () {
    var expect = chai.expect;

    before(function (done) {
        expect(emitR.ready).to.be.false;
        emitR.init()
            .done(function () {
                expect(emitR.ready).to.be.true;
                done();
            }).fail(function () {
                throw new Error('should not have failed');
            });
    });

    function emitEventFromServer() {
        return $.post("api/Test/TriggerEmit",
            {   type: arguments[0],
                args: Array.prototype.splice.call(arguments, 1) },
            function () {
            },
            "json");
    }

    describe("server events", function () {

        afterEach(function () {
            emitR.removeAllListeners();
        });

        it("should work with no parameters", function (done) {
            emitR.on("testEvent",function () {
                expect(arguments[0]).to.be.null;
                done();
            }).done(function () {
                    emitEventFromServer('testEvent');
                });
        });

        it("should be able to trigger only once", function (done) {
            var d1Count = 0;
            var d2Count = 0;
            var $d1 = $.Deferred();
            var $d2 = $.Deferred();

            function triggerOnce() {
                if (!d1Count++) {
                    return $d1.resolve();
                }
                throw new Error('should not have triggered multiple times');
            }

            function triggerMultiple() {
                d2Count++;
                if (d2Count === 3) return $d2.resolve();
            }

            $.when(emitR.once("testEvent", triggerOnce), emitR.on("testEvent", triggerMultiple))
                .done(function () {
                    emitEventFromServer('testEvent');
                    emitEventFromServer('testEvent');
                    emitEventFromServer('testEvent');
                });

            $.when($d1, $d2).done(done);
        });

        it("should work with one parameter", function (done) {
            var args = ['test1'];
            emitR.on("testEvent",function () {
                expect(arguments).to.deep.equal(args);
                done();
            }).done(function () {
                    emitEventFromServer.apply(this, ['testEvent'].concat(args));
                });
        });

        it("should fail if callback is not a function", function (done) {
            emitR.on("testEvent", {}).done(function () {
                throw new Error('should not have succeeded');
            }).fail(function () {
                    done();
                });
        });

        it("should work with multiple parameters", function (done) {
            var args = ['test1', 'test2', 'test3', 'test4', 'test5'];
            emitR.on("testEvent",function () {
                expect(arguments).to.deep.equal(args);
                done();
            }).done(function () {
                    emitEventFromServer.apply(this, ['testEvent'].concat(args));
                });
        });

        it("should work with objects as parameters", function (done) {
            var args = [
                { a: 'a', b: 'b' },
                { c: 'c', d: 'd' }
            ];
            emitR.on("testEvent",function () {
                expect(arguments).to.deep.equal(args);
                done();
            }).done(function () {
                    emitEventFromServer.apply(this, ['testEvent'].concat(args));
                });
        });

        it("should work with multiple listeners of the same event", function (done) {
            var args = ['a', 'b'];

            var done1 = $.Deferred();
            var done2 = $.Deferred();

            $.when(emitR.on("testEvent", function () {
                    expect(arguments).to.deep.equal(args);
                    done1.resolve();
                }), emitR.on("testEvent", function () {
                    expect(arguments).to.deep.equal(args);
                    done2.resolve();
                }))
                .done(emitEventFromServer.apply(this, ['testEvent'].concat(args)));

            $.when(done1, done2).then(function () {
                done();
            });
        });

        it("should work with one listener per event", function (done) {
            var args1 = ['a', 'b'];
            var args2 = ['a', 'b', 'c', 'd'];

            var d1 = $.Deferred();
            var d2 = $.Deferred();

            $.when(
                    emitR.on("testEvent1", function () {
                        expect(arguments).to.deep.equal(args1);
                        d1.resolve();
                    }),
                    emitR.on("testEvent2", function () {
                        expect(arguments).to.deep.equal(args2);
                        d2.resolve();
                    })).done(function () {
                    emitEventFromServer.apply(this, ['testEvent1'].concat(args1));
                    emitEventFromServer.apply(this, ['testEvent2'].concat(args2));
                });

            $.when(d1, d2).then(function () {
                done();
            });
        });

        it("should work with multiple listeners on multiple events", function (done) {
            setTimeout(done, 5000);
            var args1 = ['a'];
            var args2 = ['a', 'b'];
            var args3 = ['a', 'b', 'c'];

            var d11 = $.Deferred(), d12 = $.Deferred(), d13 = $.Deferred(), d21 = $.Deferred(), d22 = $.Deferred(), d31 = $.Deferred();

            $.when(
                    //testEvent1
                    emitR.on("testEvent1", function () {
                        expect(arguments).to.deep.equal(args1);
                        d11.resolve();
                    }),

                    emitR.on("testEvent1", function () {
                        expect(arguments).to.deep.equal(args1);
                        d12.resolve();
                    }),

                    emitR.on("testEvent1", function () {
                        expect(arguments).to.deep.equal(args1);
                        d13.resolve();
                    }),

                    //testEvent2
                    emitR.on("testEvent2", function () {
                        expect(arguments).to.deep.equal(args2);
                        d21.resolve();
                    }),

                    emitR.on("testEvent2", function () {
                        expect(arguments).to.deep.equal(args2);
                        d22.resolve();
                    }),

                    //testEvent3
                    emitR.on("testEvent3", function () {
                        expect(arguments).to.deep.equal(args3);
                        d31.resolve();
                    })
                ).done(function () {
                    emitEventFromServer.apply(this, ['testEvent1'].concat(args1));
                    emitEventFromServer.apply(this, ['testEvent2'].concat(args2));
                    emitEventFromServer.apply(this, ['testEvent3'].concat(args3));
                }
            );

            $.when(d11, d12, d13, d21, d22, d31).then(function () {
                done();
            });
        });

        it("should be able to remove listener from the same event", function (done) {
            var args = ['test1'];

            function doNotRemoveMe() {
                expect(arguments).to.deep.equal(args);
                done();
            }

            function removeMe() {
                throw new Error('should have been removed');
            }

            $.when(emitR.on("testEvent", doNotRemoveMe), emitR.on("testEvent", removeMe))
                .done(emitR.removeListener("testEvent", removeMe))
                .done(function () {
                    emitEventFromServer.apply(this, ['testEvent'].concat(args))
                });
        });

        it("should be able to remove last listener from an event (unsubscribe from server)", function (done) {
            function removeMe() {
                throw new Error('should have been removed');
            }

            $.when(emitR.on("testEvent", removeMe))
                .done(emitR.removeListener("testEvent", removeMe))
                .done(emitEventFromServer.apply(this, ['testEvent']))
                .done(setTimeout(done, 500)); // can't think of a more elegant way of testing this
        });
    });

    //it("should have a working addListener", function () {
    //    var e = emitR;
    //    var events_new_listener_emited = [];
    //    var listeners_new_listener_emited = [];
    //    var times_hello_emited = 0;

    //    // sanity check
    //    assert.equal(e.addListener, e.on);

    //    e.on('newListener', function (event, listener) {
    //        console.log('newListener: ' + event);
    //        events_new_listener_emited.push(event);
    //        listeners_new_listener_emited.push(listener);
    //    });

    //    function hello(a, b) {
    //        console.log('hello');
    //        times_hello_emited += 1;
    //        assert.equal('a', a);
    //        assert.equal('b', b);
    //    }

    //    e.on('hello', hello);

    //    var foo = function () { };
    //    e.once('foo', foo);

    //    e.emit('hello', 'a', 'b');

    //    assert.deepEqual(['hello', 'foo'], events_new_listener_emited);
    //    assert.deepEqual([hello, foo], listeners_new_listener_emited);
    //    assert.equal(1, times_hello_emited);

    //    //just make sure that this doesn't throw:
    //    var f = emitR;
    //    f.setMaxListeners(0);
    //});

    //it("should detect leaks", function () {
    //    var e = emitR;
    //    // default
    //    for (var i = 0; i < 10; i++) {
    //        e.on('default', function () { });
    //    }
    //    assert.ok(!e._events['default'].hasOwnProperty('warned'));
    //    e.on('default', function () { });
    //    assert.ok(e._events['default'].warned);

    //    // specific
    //    e.setMaxListeners(5);
    //    for (var i = 0; i < 5; i++) {
    //        e.on('specific', function () { });
    //    }
    //    assert.ok(!e._events['specific'].hasOwnProperty('warned'));
    //    e.on('specific', function () { });
    //    assert.ok(e._events['specific'].warned);

    //    // only one
    //    e.setMaxListeners(1);
    //    e.on('only one', function () { });
    //    assert.ok(!e._events['only one'].hasOwnProperty('warned'));
    //    e.on('only one', function () { });
    //    assert.ok(e._events['only one'].hasOwnProperty('warned'));

    //    // unlimited
    //    e.setMaxListeners(0);
    //    for (var i = 0; i < 1000; i++) {
    //        e.on('unlimited', function () { });
    //    }
    //    assert.ok(!e._events['unlimited'].hasOwnProperty('warned'));

    //    // process-wide
    //    emitR._maxListeners = undefined;
    //    emitR.defaultMaxListeners = 42;

    //    for (var i = 0; i < 42; ++i) {
    //        e.on('fortytwo', function () { });
    //    }
    //    assert.ok(!e._events['fortytwo'].hasOwnProperty('warned'));
    //    e.on('fortytwo', function () { });
    //    assert.ok(e._events['fortytwo'].hasOwnProperty('warned'));
    //    delete e._events['fortytwo'].warned;

    //    emitR.defaultMaxListeners = 44;
    //    e.on('fortytwo', function () { });
    //    assert.ok(!e._events['fortytwo'].hasOwnProperty('warned'));
    //    e.on('fortytwo', function () { });
    //    assert.ok(e._events['fortytwo'].hasOwnProperty('warned'));

    //    // but _maxListeners still has precedence over defaultMaxListeners
    //    emitR.defaultMaxListeners = 42;

    //    e.setMaxListeners(1);
    //    e.on('uno', function () { });
    //    assert.ok(!e._events['uno'].hasOwnProperty('warned'));
    //    e.on('uno', function () { });
    //    assert.ok(e._events['uno'].hasOwnProperty('warned'));

    //    // chainable
    //    assert.strictEqual(e, e.setMaxListeners(1));
    //});

    //it("should have working listeners", function () {
    //    function listener() { }
    //    function listener2() { }

    //    var e1 = emitR;

    //    e1.on('foo', listener);
    //    var fooListeners = e1.listeners('foo');
    //    assert.deepEqual(e1.listeners('foo'), [listener]);
    //    e1.removeAllListeners('foo');
    //    assert.deepEqual(e1.listeners('foo'), []);
    //    assert.deepEqual(fooListeners, [listener]);

    //    var e2 = emitR;
    //    e2.on('foo', listener);
    //    var e2ListenersCopy = e2.listeners('foo');
    //    assert.deepEqual(e2ListenersCopy, [listener]);
    //    assert.deepEqual(e2.listeners('foo'), [listener]);
    //    e2ListenersCopy.push(listener2);
    //    assert.deepEqual(e2.listeners('foo'), [listener]);
    //    assert.deepEqual(e2ListenersCopy, [listener, listener2]);

    //    var e3 = emitR;
    //    e3.on('foo', listener);
    //    var e3ListenersCopy = e3.listeners('foo');
    //    e3.on('foo', listener2);
    //    assert.deepEqual(e3.listeners('foo'), [listener, listener2]);
    //    assert.deepEqual(e3ListenersCopy, [listener]);
    //});

    //it("should have working listeners with no side effects", function () {
    //    var e = emitR;
    //    var fl; // foo listeners

    //    fl = e.listeners('foo');
    //    assert(Array.isArray(fl));
    //    assert(fl.length === 0);
    //    assert.deepEqual(e._events, {});

    //    e.on('foo', assert.fail);
    //    fl = e.listeners('foo');
    //    assert(e._events.foo === assert.fail);
    //    assert(Array.isArray(fl));
    //    assert(fl.length === 1);
    //    assert(fl[0] === assert.fail);

    //    e.listeners('bar');
    //    assert(!e._events.hasOwnProperty('bar'));

    //    e.on('foo', assert.ok);
    //    fl = e.listeners('foo');

    //    assert(Array.isArray(e._events.foo));
    //    assert(e._events.foo.length === 2);
    //    assert(e._events.foo[0] === assert.fail);
    //    assert(e._events.foo[1] === assert.ok);

    //    assert(Array.isArray(fl));
    //    assert(fl.length === 2);
    //    assert(fl[0] === assert.fail);
    //    assert(fl[1] === assert.ok);
    //});

    //it("should have working maxListeners", function () {
    //    var gotEvent = false;

    //    var e = new emitR();

    //    e.on('maxListeners', function () {
    //        gotEvent = true;
    //    });

    //    // Should not corrupt the 'maxListeners' queue.
    //    e.setMaxListeners(42);

    //    e.emit('maxListeners');

    //    assert(gotEvent);
    //});

    //it("should have working emitter modifications within emit", function () {
    //    var callbacks_called = [];

    //    var e = new emitR();

    //    function callback1() {
    //        callbacks_called.push('callback1');
    //        e.on('foo', callback2);
    //        e.on('foo', callback3);
    //        e.removeListener('foo', callback1);
    //    }

    //    function callback2() {
    //        callbacks_called.push('callback2');
    //        e.removeListener('foo', callback2);
    //    }

    //    function callback3() {
    //        callbacks_called.push('callback3');
    //        e.removeListener('foo', callback3);
    //    }

    //    e.on('foo', callback1);
    //    assert.equal(1, e.listeners('foo').length);

    //    e.emit('foo');
    //    assert.equal(2, e.listeners('foo').length);
    //    assert.deepEqual(['callback1'], callbacks_called);

    //    e.emit('foo');
    //    assert.equal(0, e.listeners('foo').length);
    //    assert.deepEqual(['callback1', 'callback2', 'callback3'], callbacks_called);

    //    e.emit('foo');
    //    assert.equal(0, e.listeners('foo').length);
    //    assert.deepEqual(['callback1', 'callback2', 'callback3'], callbacks_called);

    //    e.on('foo', callback1);
    //    e.on('foo', callback2);
    //    assert.equal(2, e.listeners('foo').length);
    //    e.removeAllListeners('foo');
    //    assert.equal(0, e.listeners('foo').length);

    //    // Verify that removing callbacks while in emit allows emits to propagate to
    //    // all listeners
    //    callbacks_called = [];

    //    e.on('foo', callback2);
    //    e.on('foo', callback3);
    //    assert.equal(2, e.listeners('foo').length);
    //    e.emit('foo');
    //    assert.deepEqual(['callback2', 'callback3'], callbacks_called);
    //    assert.equal(0, e.listeners('foo').length);
    //});

    //it("should work with any number of arguments", function () {
    //    var e = new emitR(), num_args_emited = [];

    //    e.on('numArgs', function () {
    //        var numArgs = arguments.length;
    //        console.log('numArgs: ' + numArgs);
    //        num_args_emited.push(numArgs);
    //    });

    //    console.log('start');

    //    e.emit('numArgs');
    //    e.emit('numArgs', null);
    //    e.emit('numArgs', null, null);
    //    e.emit('numArgs', null, null, null);
    //    e.emit('numArgs', null, null, null, null);
    //    e.emit('numArgs', null, null, null, null, null);

    //    assert.deepEqual([0, 1, 2, 3, 4, 5], num_args_emited);
    //});

    //it("should be able to emit an event once", function() {
    //    var e = new emitR();
    //    var times_hello_emited = 0;

    //    e.once('hello', function (a, b) {
    //        times_hello_emited++;
    //    });

    //    e.emit('hello', 'a', 'b');
    //    e.emit('hello', 'a', 'b');
    //    e.emit('hello', 'a', 'b');
    //    e.emit('hello', 'a', 'b');

    //    var remove = function () {
    //        assert.fail(1, 0, 'once->foo should not be emitted', '!');
    //    };

    //    e.once('foo', remove);
    //    e.removeListener('foo', remove);
    //    e.emit('foo');

    //    assert.equal(1, times_hello_emited);
    //});

    //it("should be able to remove all listeners", function () {
    //    function listener() { }
    //    function expect(expected) {
    //        var actual = [];
    //        process.on('exit', function () {
    //            assert.deepEqual(actual.sort(), expected.sort());
    //        });
    //        function listener(name) {
    //            actual.push(name);
    //        }
    //        return common.mustCall(listener, expected.length);
    //    }

    //    var e1 = new emitR();
    //    e1.on('foo', listener);
    //    e1.on('bar', listener);
    //    e1.on('baz', listener);
    //    e1.on('baz', listener);
    //    var fooListeners = e1.listeners('foo');
    //    var barListeners = e1.listeners('bar');
    //    var bazListeners = e1.listeners('baz');
    //    //e1.on('removeListener', expect(['bar', 'baz', 'baz']));
    //    e1.removeAllListeners('bar');
    //    e1.removeAllListeners('baz');
    //    assert.deepEqual(e1.listeners('foo'), [listener]);
    //    assert.deepEqual(e1.listeners('bar'), []);
    //    assert.deepEqual(e1.listeners('baz'), []);
    //    // after calling removeAllListeners,
    //    // the old listeners array should stay unchanged
    //    assert.deepEqual(fooListeners, [listener]);
    //    assert.deepEqual(barListeners, [listener]);
    //    assert.deepEqual(bazListeners, [listener, listener]);
    //    // after calling removeAllListeners,
    //    // new listeners arrays are different from the old
    //    assert.notEqual(e1.listeners('bar'), barListeners);
    //    assert.notEqual(e1.listeners('baz'), bazListeners);

    //    var e2 = new emitR();
    //    e2.on('foo', listener);
    //    e2.on('bar', listener);
    //    // expect LIFO order
    //    //e2.on('removeListener', expect(['foo', 'bar', 'removeListener']));
    //    //e2.on('removeListener', expect(['foo', 'bar']));
    //    e2.removeAllListeners();
    //    console.error(e2);
    //    assert.deepEqual([], e2.listeners('foo'));
    //    assert.deepEqual([], e2.listeners('bar'));
    //});

    //it("should be able to remove listeners", function() {
    //    var count = 0;

    //    function listener1() {
    //        console.log('listener1');
    //        count++;
    //    }

    //    function listener2() {
    //        console.log('listener2');
    //        count++;
    //    }

    //    function listener3() {
    //        console.log('listener3');
    //        count++;
    //    }

    //    function remove1() {
    //        assert(0);
    //    }

    //    function remove2() {
    //        assert(0);
    //    }

    //    var e1 = new emitR();
    //    e1.on('hello', listener1);
    //    //e1.on('removeListener', common.mustCall(function(name, cb) {
    //    //    assert.equal(name, 'hello');
    //    //    assert.equal(cb, listener1);
    //    //}));
    //    e1.removeListener('hello', listener1);
    //    assert.deepEqual([], e1.listeners('hello'));

    //    var e2 = new emitR();
    //    e2.on('hello', listener1);
    //    e2.on('removeListener', assert.fail);
    //    e2.removeListener('hello', listener2);
    //    assert.deepEqual([listener1], e2.listeners('hello'));

    //    var e3 = new emitR();
    //    e3.on('hello', listener1);
    //    e3.on('hello', listener2);
    //    //e3.on('removeListener', common.mustCall(function(name, cb) {
    //    //    assert.equal(name, 'hello');
    //    //    assert.equal(cb, listener1);
    //    //}));
    //    e3.removeListener('hello', listener1);
    //    assert.deepEqual([listener2], e3.listeners('hello'));

    //    var e4 = new emitR();
    //    //e4.on('removeListener', common.mustCall(function(name, cb) {
    //    //    if (cb !== remove1) return;
    //    //    this.removeListener('quux', remove2);
    //    //    this.emit('quux');
    //    //}, 2));
    //    e4.on('quux', remove1);
    //    e4.on('quux', remove2);
    //    e4.removeListener('quux', remove1);
    //});

    //it("should not have side effects on setMaxListeners", function() {
    //    var e = new emitR;
    //    assert.deepEqual(e._events, {});
    //    e.setMaxListeners(5);
    //    assert.deepEqual(e._events, {});
    //});
});
