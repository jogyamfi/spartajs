/**
 *
 * sparta.js 0.5.0 <http://www.spartajs.com>
 * Copyright 2013-2014 James Gyamfi
 *
 *
 *
 * Parts of sparta.js is based on Backbone (Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.) 
 * Parts of sparta.js is based on Underscore (Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.) 
 */
(function(ko) {
    'use strict';
    var root=this,
        previousSparta=root.sparta,
        sparta,
        extend,
        ViewModel,
        utils,
        View,
        Region,
        navManager,
        routeManager,
        defer,
        regionManager,
        defaultViewModelLocator,
        AppArea,
        viewModelRegistry,
        viewModelLocator,
        stopBindingStart='<!-- ko stopBinding: true -->',
        stopBindingTerminator=' <!-- /ko -->',
        pubsub,
        wrapDefer;



    if (typeof exports !== 'undefined') {
        sparta = exports;

    } else {
        sparta = root.sparta = {};
    }

    //current version
    sparta.version = "0.0.1";

    sparta.$ = root.jQuery;

    sparta.noConflict = function() {
        root.sparta = previoussparta;
        return this;
    };

    sparta.defaults = {

        templateUrl: 'templates/',
        usePushState: false,
        getDefaultViewRoute: function(viewName) {
            return "/" + viewName;
        },
        viewModelLocator: function(viewName) {
            var viewModel = sparta.viewModelLocator.find(viewName);
            return viewModel;
        }
    };

    sparta.setDefaults = function(params) {
        sparta.utils.extend(sparta.defaults, params);
    };

    defer = function(action) {
        return $.Deferred(action);
    };

    var array = [];
    var push = array.push;
    var slice = array.slice;
    var splice = array.splice;

    utils = sparta.utils = (function() {
        var ArrayProto = Array.prototype,
            ObjProto = Object.prototype,
            FuncProto = Function.prototype,
            nativeForEach = ArrayProto.forEach,
            nativeMap = ArrayProto.map,
            nativeReduce = ArrayProto.reduce,
            nativeReduceRight = ArrayProto.reduceRight,
            nativeFilter = ArrayProto.filter,
            nativeEvery = ArrayProto.every,
            nativeSome = ArrayProto.some,
            nativeIndexOf = ArrayProto.indexOf,
            nativeLastIndexOf = ArrayProto.lastIndexOf,
            nativeIsArray = Array.isArray,
            nativeKeys = Object.keys,
            nativeBind = FuncProto.bind,
            push = ArrayProto.push,
            slice = ArrayProto.slice,
            concat = ArrayProto.concat,
            toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty,
            breaker = {},
            reflect = {},
            has = function(obj, key) {
                return ObjProto.hasOwnProperty.call(obj, key);
            },
            extend = function(obj) {
                each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            obj[prop] = source[prop];
                        }
                    }
                });
                return obj;
            },
            each = function(obj, iterator, context) {
                if (obj == null) return;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    for (var key in obj) {
                        if (has(obj, key)) {
                            if (iterator.call(context, obj[key], key, obj) === breaker) return;
                        }
                    }
                }
            },
            bind = function(func, context) {
                if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                var args = slice.call(arguments, 2);
                return function() {
                    return func.apply(context, args.concat(slice.call(arguments)));
                };
            },
            bindAll = function(obj) {
                var funcs = slice.call(arguments, 1);
                if (funcs.length === 0) funcs = functions(obj);
                each(funcs, function(f) {
                    obj[f] = bind(obj[f], obj);
                });
                return obj;
            },
            identity = function(value) {
                return value;
            },
            any = function(obj, iterator, context) {
                iterator || (iterator = identity); //check 
                var result = false;
                if (obj == null) return result;
                if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
                each(obj, function(value, index, list) {
                    if (result || (result = iterator.call(context, value, index, list))) return breaker;
                });
                return !!result;
            },
            isFunction = function(obj) {
                return typeof obj === 'function';
            },
            functions = function(obj) {
                var names = [];
                for (var key in obj) {
                    if (isFunction(obj[key])) names.push(key);
                }
                return names.sort();
            },
            keys = nativeKeys || function(obj) {
                if (obj !== Object(obj)) throw new TypeError('Invalid object');
                var keys = [];
                for (var key in obj) if (has(obj, key)) keys[keys.length] = key;
                return keys;
            },
            result = function(object, property) {
                if (object == null) return null;
                var value = object[property];
                return isFunction(value) ? value.call(object) : value;
            },
            map = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
                each(obj, function(value, index, list) {
                    results[results.length] = iterator.call(context, value, index, list);
                });
                return results;
            },
            find = function(obj, iterator, context) {
                var result;
                any(obj, function(value, index, list) {
                    if (iterator.call(context, value, index, list)) {
                        result = value;
                        return true;
                    }
                });
                return result;
            },
            filter = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
                each(obj, function(value, index, list) {
                    if (iterator.call(context, value, index, list)) results[results.length] = value;
                });
                return results;
            },
            pluck = function(obj, key) {
                return map(obj, function(value) {
                    return value[key];
                });
            },
            lookupIterator = function(value) {
                return sparta.utils.reflect.isFunction(value) ? value : function(obj) {
                    return obj[value];
                };
            },
            sortBy = function(obj, value, context) {
                var iterator = lookupIterator(value);
                return pluck(map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iterator.call(context, value, index, list)
                    };
                }).sort(function(left, right) {
                    var a = left.criteria;
                    var b = right.criteria;
                    if (a !== b) {
                        if (a > b || a === void 0) return 1;
                        if (a < b || b === void 0) return -1;
                    }
                    return left.index < right.index ? -1 : 1;
                }), 'value');
            },
            contains = function(obj, target) {
                if (obj == null) return false;
                if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
                return any(obj, function(value) {
                    return value === target;
                });
            },
            clone = function(obj) {
                if (!sparta.utils.reflect.isObject(obj)) return obj;
                return sparta.utils.reflect.isArray(obj) ? obj.slice() : sparta.utils.extend({}, obj);
            },
            difference = function(array) {
                var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
                return filter(array, function(value) {
                    return !contains(rest, value);
                });
            },
            once = function(func) {
                var ran = false,
                    memo;
                return function() {
                    if (ran) return memo;
                    ran = true;
                    memo = func.apply(this, arguments);
                    func = null;
                    return memo;
                };
            },
            wrapDeferred = function (returnVal) {

                var promise;

                if (returnVal && $.isFunction(returnVal.promise)) {
                    promise = returnVal.promise();
                } else {
                    var deferred = new $.Deferred();

                    deferred.resolve();

                    promise = deferred.promise();
                }

                return promise;
            };

        // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
        each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
            reflect['is' + name] = function(obj) {
                return toString.call(obj) == '[object ' + name + ']';
            };
        });

        reflect.isObject = function(obj) {
            return obj === Object(obj);
        };

        reflect.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) == '[object Array]';
        };

        return {
            has: has,
            extend: extend,
            each: each,
            bind: bind,
            bindAll: bindAll,
            any: any,
            identity: identity,
            isFunction: isFunction,
            functions: functions,
            keys: keys,
            result: result,
            map: map,
            find: find,
            filter: filter,
            reflect: reflect,
            pluck: pluck,
            sortBy: sortBy,
            clone: clone,
            contains: contains,
            difference: difference,
            once: once,
            wrapDeferred : wrapDeferred

        };

    }());

    wrapDefer = sparta.utils.wrapDeferred;

    extend = function(protoProps, staticProps) {
        var parent = this,
            child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && sparta.utils.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function() {
                return parent.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        sparta.utils.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function() {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate; // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) utils.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    };

    //Events clone on Backbone Events

    var eventSplitter = /\s+/;

    var eventsApi = function(obj, action, name, rest) {
        if (!name) return true;
        if (typeof name === 'object') {
            for (var key in name) {
                obj[action].apply(obj, [key, name[key]].concat(rest));
            }
        } else if (eventSplitter.test(name)) {
            var names = name.split(eventSplitter);
            for (var i = 0, l = names.length; i < l; i++) {
                obj[action].apply(obj, [names[i]].concat(rest));
            }
        } else {
            return true;
        }
    };

    var triggerEvents = function(events, args) {
        var ev, i = -1,
            l = events.length;
        switch (args.length) {
            case 0:
                while (++i < l)(ev = events[i]).callback.call(ev.ctx);
                return;
            case 1:
                while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0]);
                return;
            case 2:
                while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
                return;
            case 3:
                while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
                return;
            default:
                while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
        }
    };

    var Events = sparta.Events = {

        // Bind one or more space separated events, or an events map,
        // to a `callback` function. Passing `"all"` will bind the callback to
        // all events fired.
        on: function(name, callback, context) {
            if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
            this._events || (this._events = {});
            var list = this._events[name] || (this._events[name] = []);
            list.push({
                callback: callback,
                context: context,
                ctx: context || this
            });
            return this;
        },

        // Bind events to only be triggered a single time. After the first time
        // the callback is invoked, it will be removed.
        once: function(name, callback, context) {
            if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
            var self = this;
            var once = sparta.utils.once(function() {
                self.off(name, once);
                callback.apply(this, arguments);
            });
            once._callback = callback;
            this.on(name, once, context);
            return this;
        },

        // Remove one or many callbacks. If `context` is null, removes all
        // callbacks with that function. If `callback` is null, removes all
        // callbacks for the event. If `name` is null, removes all bound
        // callbacks for all events.
        off: function(name, callback, context) {
            var list, ev, events, names, i, l, j, k;
            if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
            if (!name && !callback && !context) {
                this._events = {};
                return this;
            }

            names = name ? [name] : sparta.utils.keys(this._events);
            for (i = 0, l = names.length; i < l; i++) {
                name = names[i];
                if (list = this._events[name]) {
                    events = [];
                    if (callback || context) {
                        for (j = 0, k = list.length; j < k; j++) {
                            ev = list[j];
                            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) || (context && context !== ev.context)) {
                                events.push(ev);
                            }
                        }
                    }
                    this._events[name] = events;
                }
            }

            return this;
        },

        // Trigger one or many events, firing all bound callbacks. Callbacks are
        // passed the same arguments as `trigger` is, apart from the event name
        // (unless you're listening on `"all"`, which will cause your callback to
        // receive the true name of the event as the first argument).
        trigger: function(name) {
            if (!this._events) return this;
            var args = slice.call(arguments, 1);
            if (!eventsApi(this, 'trigger', name, args)) return this;
            var events = this._events[name];
            var allEvents = this._events.all;
            if (events) triggerEvents(events, args);
            if (allEvents) triggerEvents(allEvents, arguments);
            return this;
        },

        // An inversion-of-control version of `on`. Tell *this* object to listen to
        // an event in another object ... keeping track of what it's listening to.
        listenTo: function(obj, name, callback) {
            var listeners = this._listeners || (this._listeners = {});
            var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
            listeners[id] = obj;
            obj.on(name, typeof name === 'object' ? this : callback, this);
            return this;
        },

        // Tell this object to stop listening to either specific events ... or
        // to every object it's currently listening to.
        stopListening: function(obj, name, callback) {
            var listeners = this._listeners;
            if (!listeners) return;
            if (obj) {
                obj.off(name, typeof name === 'object' ? this : callback, this);
                if (!name && !callback) delete listeners[obj._listenerId];
            } else {
                if (typeof name === 'object') callback = this;
                for (var id in listeners) {
                    listeners[id].off(name, callback, this);
                }
                this._listeners = {};
            }
            return this;
        }
    };

    // Aliases for backwards compatibility.
    Events.bind = Events.on;
    Events.unbind = Events.off;

    // Allow the `sparta` object to serve as a global event bus, for folks who
    // want global "pubsub" in a convenient place.
    utils.extend(sparta, Events);

    AppArea = sparta.AppArea = function(params) {

        this.name = params.name;

        this.el = params.el;

        this.regions = {};

    };

    utils.extend(AppArea.prototype, {

        validate: function(parameters) {
            if (!parameters.name) {
                throw 'Invalid Area Name';
            }

            if (!parameters.el) {
                throw 'invalid area element id';
            }
        },
        getRegions: function() {
            return this.regions;
        },
        addRegion: function(newRegion) {
            var regionName = newRegion.name.toLowerCase();
            if (this.regions[regionName]) {
                throw 'Region ' + newRegion.name + 'already exists in area ' + this.name;
            }
            this.regions[regionName] = newRegion;
        },
        show: function() {

            $("#" + this.el).show();
        },
        hide: function() {

            $("#" + this.el).hide();
        }
    });

    Region = sparta.Region = function(params) {

        var self = this;

        self.validate(params);

        self.name = params.name;

        self.el = params.el;

        self.views = {};

        self.area = params.area ? params.area : 'default-area';

        sparta.regionManager.add(self, params.name);

    };

    utils.extend(Region.prototype, {
        validate: function(parameters) {
            if (!parameters.name) {
                throw 'Invalid region name';
            }

            if (!parameters.el) {
                throw 'invalid region element id';
            }
        },
        getViews: function() {
            return this.views;
        },
        addView: function(newView) {
            var viewName = newView.name.toLowerCase();
            if (this.views[viewName]) {
                throw 'View ' + newView.name + 'already exists in region ' + this.name;
            }
            this.views[viewName] = newView;
        },
        show: function() {

            $("#" + this.el).show();
        },
        hide: function() {

            $("#" + this.el).hide();
        }
    });

    regionManager = sparta.regionManager = function() {

        var regionList = {},
        viewCache = {},
        add = function(region) {
            if (!region) {
                throw 'Invalid region';
            }

            var regionNameLowerCase = region.name.toLowerCase();

            if (regionList[regionNameLowerCase]) {
                throw 'Region ' + region.name + ' has already been defined. Region names are not case sensitive';
            }

            regionList[regionNameLowerCase] = region;
        },
        remove = function(region) {
            var regionNameLowerCase = region.name.toLowerCase();

            delete regionList[regionNameLowerCase];


        },
        find = function(regionName) {
            return regionList[regionName.toLowerCase()];
        },
        addViewToRegion = function(view, regionName) {
            var region = find(regionName);

            if (!region) {
                throw 'region ' + regionName + 'not found';
            }
            view.region = region.name;
            region.addView(view);
            viewCache[regionName.toLowerCase()] = view;
        },
        findView = function(viewName) {
            var view = null;

            sparta.utils.find(regionList, function(region) {

                var foundView = sparta.utils.find(region.getViews(), function(view) {

                    return view.name.toLowerCase() === viewName.toLowerCase();
                });
                view = foundView;
                return foundView;
            });

            return view;
        },
        findSiblingViews = function(view) {

            var foundViews = [],
                i,
                region;

            region = sparta.regionManager.find(view.region);

            if (!region) {
                return foundViews;
            }

            foundViews = sparta.utils.filter(region.getViews(), function(aView) {
                return aView !== view;
            });

            return foundViews;
        },
        getViewsInArea = function(areaName) {
            return null;
        },
        getAllViews = function() {
            var views = [];
            sparta.utils.each(regionList, function(region) {
                var regionViews = region.getViews();
                sparta.utils.each(regionViews, function(view) {
                    views.push(view);
                });
            });

            return views;
        };

        return {
            add: add,
            remove: remove,
            find: find,
            addViewToRegion: addViewToRegion,
            findView: findView,
            findSiblingViews: findSiblingViews,
            getAllViews: getAllViews
        };

    }();

    ViewModel = sparta.ViewModel = function(options) {

        this.viewEls = []; //for possible unbind later

        // multiple views bound to the same view mode

        this.isReusable = options && options.isReusable || false;

        this.isInit = false;

        this.id = options && options.id || null;

        // if (options && options.id) {
        //     viewModelRegistry.add(options.id, this);
        // }

        this.construct.apply(this, arguments);
    };

    utils.extend(ViewModel.prototype, {
        // init is an empty function by default. Override it with your own
        // initialization logic.
        // called before bind
        preBind: function() {

        },

        bind: function(el) {
            if (!el) {
                return;
            }
            this.viewEls.push(el);

            var bindingRoot = document.getElementById(el),
                self = this;

            ko.applyBindings(self, bindingRoot);

            //todo prevent binding overlap
        },
        // called after bind
        init: function() {

        },

        activate: function(params) {

        },

        deactivate: function(params) {

        },

        destroy: function() {

        },
        construct: function(options) {

        }

    });

    viewModelLocator = sparta.viewModelLocator = function() {

        var registry = {},

        register = function(viewName, viewModel) {

            if (typeof viewName !== 'string') {
                throw new Error("viewName must be a string");
            }

            registry[viewName.toLowerCase()] = {
                type: typeof viewModel,
                viewModel: viewModel
            };
        },

        find = function(viewModel) {
            var info = registry[viewModel.toLowerCase()];

            if (!info) {
                return null;
            } else {
                if (info.type === 'function') {
                    return info.viewModel();
                } else {
                    return info.viewModel;
                }
            }
        };

        return {
            register: register,
            find: find
        };
    }();


    // viewModelRegistry = sparta.viewModelRegistry = function() {

    //     var viewModels = {},
    //     find = function(viewModelName) {
    //         return viewModels[viewModelName.toLowerCase()];
    //     },
    //     add = function(viewModelName, viewModel) {

    //         if (find(viewModelName)) {
    //             throw new Error('viewmodel ' + viewModelName + ' already exists');
    //         }
    //         viewModels[viewModelName.toLowerCase()] = viewModel;
    //     },
    //     remove = function(viewModelName) {
    //         var name = viewModelName.toLowerCase();
    //         if (viewModels[name]) delete viewModels[name];
    //     };

    //     return {
    //         find: find,
    //         add: add,
    //         remove: remove
    //     };

    // }();

    View = sparta.View = function(params) {

        this.validate(params);

        this.name = params.name;

        this.templateName = params.templateName ? params.templateName : null;

        this.templateUrl = params.templateUrl ? params.templateUrl : null;

        this.el = params.el;

        this.regionName = params.region; // name or region object

        this.recompose = params.recompose === true ? true : false;

        this.isInit = false;

        this.viewModel = params.viewModel || null;

        this.routeable = params.routeable === false ? false : true;

        this.manualUrl = params.routeUrl;

        this.routeUrl = function() {
            if (this.manualUrl) {
                return this.manualUrl;
            } else {
                return sparta.defaults.getDefaultViewRoute(params.name);
            }
        };

        this.useNameAsRoute = params.useNameAsRoute === false ? false : true;

        this.elTag = params.elTag || 'div';
        
        this.className = params.className || null;

        sparta.regionManager.addViewToRegion(this, params.region);

        this.construct.apply(this, arguments);
    };

    utils.extend(View.prototype, {

        validate: function(parameters) {
            if (!parameters.name) {
                throw 'Invalid View Name';
            }

            if (!parameters.el) {
                throw 'invalid element id';
            }

            if (!parameters.region) {
                throw 'invalid region';
            }

            if (!sparta.regionManager.find(parameters.region)) {
                throw 'could not find region : ' + parameters.region;
            }
        },
        destroy: function() {

        },
        construct: function() {

        },
        preRender: function() {
            //override with logic to run before render
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred.promise();
        },
        render: function(callback) {
            var viewUrl,
            region,
            self = this,
                deferred = $.Deferred(),
                insertIntoDom = function(template) {
                    var divBuilder = stopBindingStart,
                        classDetails = "";

                    if (self.className) {
                        classDetails = " class='" + self.className + "'";
                    }

                    divBuilder += "<" + self.elTag + " id='" + self.el + "'" + classDetails +">" + template + "</" + self.elTag + ">";

                    divBuilder += stopBindingTerminator;

                    $("#" + region.el).append(divBuilder);

                    deferred.resolve(self);

                    if (callback) {
                        callback(self);
                    }
                };

            if (typeof callback !== "function") {
                callback = false;
            }

            viewUrl = self.getViewTemplateUrl();

            region = sparta.regionManager.find(self.region);

            //have we loaded template into cache
            if (self.cachedTemplate) {
                insertIntoDom(self.cachedTemplate);
            } else {
                $.get(viewUrl, {
                    "_": $.now()
                }, insertIntoDom, "text").fail(function(ex) {
                    sparta.error("could not find template" + ex);
                });
            }

            return deferred.promise();
        },
        getViewTemplateUrl: function() {

            var self = this,
                url = sparta.defaults.templateUrl + self.templateName;

            if (self.templateUrl) {
                url = self.templateUrl;
            }

            return url;
        }
    });

    sparta.viewLoader = (function() {

        var loadedViews = [],
            self = this,
            cachedTemplates = {};

        function getLoadedView(viewName) {
            var i;
            for (i = 0; i < loadedViews.length; i++) {
                if (loadedViews[i].name === viewName) {
                    return loadedViews[i];
                }
            }
            return null;
        }
        // Marked for delete
        // function loadViewIntoDom(view, callback) {

        //     var viewUrl, region;

        //     if (typeof callback !== "function") {
        //         callback = false;
        //     }

        //     // if defined used defined area else look in template folder

        //     viewUrl = sparta.defaults.templateUrl + view.templateName;

        //     if (view.templateUrl) {
        //         viewUrl = view.templateUrl;
        //     }

        //     region = sparta.regionManager.find(view.region);

        //     $.get(viewUrl, function(template) {

        //         var divBuilder = "<" + view.elTag + " id='" + view.el + "'>" + template + "</" + view.elTag + ">";

        //         $("#" + region.el).append(divBuilder);

        //         loadedViews.push(view);

        //         if (callback) {
        //             callback(view);
        //         }
        //     }, "text");

        // }

        function loadView(viewName, callback) {

            if (typeof callback !== "function") {
                callback = false;
            }
            var view = getLoadedView(viewName),
                element;

            if (view) {

                if (callback) {
                    callback(view);
                }
            } else {
                view = sparta.regionManager.findView(viewName);

                if (view) {

                    if (!view.viewModel) {
                        //use default view locator to load viewModel

                        var viewModel = sparta.defaults.viewModelLocator(viewName);

                        if (viewModel) {
                            // throw exception here!!!
                            view.viewModel = viewModel;
                        }
                    }

                    element = document.getElementById(view.el);

                    if (!element) {
                        // loadViewIntoDom(view, callback);
                        wrapDefer(view.preRender()).then(function () { return view.render(callback); });
                       // view.preRender().then(view.render(callback));
                    } else {
                        if (callback) {
                            callback(view);
                        }
                    }

                } else {

                    throw new Error(viewName + ' not found');
                }
            }
        }

        function removeLoadedViewByName(viewName) {
            var view;

            view = sparta.regionManager.findView(viewName);

            if (view) {

                self.removeLoadedView(view);
            }
        }

        function removeLoadedView(view) {
            var index;

            index = self.loadedViews.indexOf(view);

            if (index !== -1) {
                self.loadedViews.splice(index, 1);
                $('#' + view.el).remove();
            }
        }

        function defaultViewLocatorConvention(view) {

            return "/app/views/templates/" + view.name + ".html";
        }

        function loadTemplates(viewNames, callback) {
            var deferreds = [];

            if (typeof callback !== "function") {
                callback = false;
            }

            var returnedDeferred = $.Deferred();

            $.each(viewNames, function(index, viewName) {

                var view = sparta.regionManager.findView(viewName);

                if (!view) {
                    throw new Error('View ' + viewName + ' not found');
                }
                deferreds.push($.get(view.getViewTemplateUrl(), {
                    "_": $.now()
                }, function(data) {
                    view.cachedTemplate = data;
                }, "text"));

            });

            $.when.apply(null, deferreds).done(function() {
                returnedDeferred.resolve();
                if (callback) {
                    callback();
                }

            });

            return returnedDeferred.promise();
        }

        return {
            loadedViews: loadedViews,
            loadView: loadView,
            removeLoadedView: removeLoadedView,
            removeLoadedViewByName: removeLoadedViewByName,
            defaultViewLocatorConvention: defaultViewLocatorConvention,
            viewLocatorConvention: defaultViewLocatorConvention,
            loadTemplates: loadTemplates
        };

    }());


    //sparta.Router
    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    var Router = sparta.Router = function(options) {
        options || (options = {});
        if (options.routes) this.routes = options.routes;
        this._bindRoutes();
        this.initialize.apply(this, arguments);
    };

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    var routeParam = /((\(\?)?:\w+)|(\*\w+)/g;

    // Added for named param
    var paramNamesPattern = /(\(.*?)?[:\*]\w+\)?/g;
    var optionalParamPattern = /\(.*?[:\*](\w+)\)/;
    var queryStringPattern = /\?.*$/;
    var plusPattern = /\+/g;
    var r20Pattern = /%20/g;
    //var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    // Set up all inheritable **Backbone.Router** properties and methods.
    sparta.utils.extend(Router.prototype, Events, {

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function() {

            this._routes = {};
            this._named = {};
        },

        // Manually bind a single named route to a callback. For example:
        //
        //     this.route('search/:query/p:num', 'search', function(query, num) {
        //       ...
        //     });
        //
        route: function(route, name, callback) {
            var routeString = route;
            if (!sparta.utils.reflect.isRegExp(route)) route = this._routeToRegExp(route);
            if (sparta.utils.isFunction(name)) {
                callback = name;
                name = '';
            }
            if (!callback) callback = this[name];
            var router = this;

            this._storeRoute(routeString, name);
            sparta.history.route(route, function(fragment) {
                var args = router._extractParameters(route, fragment);
                callback && callback.apply(router, args);
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                sparta.history.trigger('route', router, name, args);
                //added this
                router.trigger('system_routed_event', name, args);
            });
            return this;
        },

        // Simple proxy to `Backbone.history` to save a fragment into the history.
        navigate: function(fragment, options) {
            sparta.history.navigate(fragment, options);
            return this;
        },

        // Bind all defined routes to `Backbone.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function() {
            if (!this.routes) return;
            this.routes = sparta.utils.result(this, 'routes');
            var route, routes = sparta.utils.keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(route, this.routes[route]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function(route) {
            route = route.replace(escapeRegExp, '\\$&')
                .replace(optionalParam, '(?:$1)?')
                .replace(namedParam, function(match, optional) {
                return optional ? match : '([^\/]+)';
            })
                .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return sparta.utils.map(params, function(param) {
                return param ? decodeURIComponent(param) : null;
            });
        },
        _extractKeyValueParameters: function(route, fragment) {
            var params = {};

            // Remove any query parameters from fragment
            var query = Router.utils.getQueryString(fragment);
            fragment = fragment.replace(query, '');

            // Parse query parameters and merge onto hash
            if (query) {
                sparta.utils.extend(params, Router.utils.deparam(query.substr(1)));
            }

            // Extract named/splat parameters and merge onto hash
            var paramNames = this._routes[route].parameters;
            var paramValues = _extractKeyValueParameters.call(this, route, fragment);
            if (paramValues) {
                sparta.utils.each(paramValues, function(param, i) {
                    // Set the parameter key to the name in the names array or, if no
                    // name is in the array, the index value
                    var key = paramNames[i] || i;
                    params[key] = param;
                });
            }
            return params;
        },
        _storeRoute: function(route, name) {
            var url = route;

            // Create a regular expression of the route
            if (!sparta.utils.reflect.isRegExp(route)) {
                route = this._routeToRegExp(route);
            }

            // Get route parameter names and any optionals
            var optionals = [];
            var parameters = sparta.utils.map(url.match(paramNamesPattern), function(name) {
                var optional = name.match(optionalParamPattern);
                if (optional) {
                    name = optional[1];
                    optionals.push(name);
                } else {
                    name = name.substr(1);
                }
                return name;
            });

            // Store hash of route information on the router
            this._routes[route] = {
                route: route,
                url: url !== route ? url : undefined,
                parameters: parameters,
                optionalParameters: optionals,
                name: name
            };

            // Add route information to an array of routes associated with a method
            this._named[name] = this._named[name] || [];
            this._named[name].push(this._routes[route]);

            // Sort the named route array by number of parameters
            this._named[name] = sparta.utils.sortBy(this._named[name], function(route) {
                return route.parameters.length;
            });

            return route;
        },
        _buildUrl: function(route, params) {
            params = sparta.utils.clone(params || {});

            // Get route information
            route = this._routes[route];

            // Start with the base and leading slash
            var url = '/' + (route.url || '');

            // Replace named/splat parts with their parameter equivalent
            sparta.utils.each(route.parameters, function(name) {
                // Find named/splat parts that match the passed parameter
                var match = url.match(new RegExp('(\\(.*?)?[:\\*]' + name + '\\)?'));
                if (match) {
                    var value = params[name];

                    // Optional parameters that don't exist on the params hash should
                    // be removed
                    if (!sparta.utils.reflect.isString(value)) {
                        //  value = ''; what do we do here
                    }
                    // Add any leading characters stripped out of optional parts
                    else {
                        if (match[1]) {
                            value = match[1].substring(1) + value;
                        }
                    }

                    // Replace url part with the parameter value
                    url = url.replace(match[0], value);

                    // Remove this parameter from the hash
                    delete params[name];
                }
            });

            // Add any extra items as query parameters to url
            var query = Router.utils.param(params);
            if (query) {
                url += '?' + query;
            }

            return url;
        },
        url: function(name, params) {
            params = params || {};

            // Determine the best match for this route with the passed params
            var routes = this._named[name] || [];
            var keys = sparta.utils.keys(params);
            var route = sparta.utils.find(routes, function(route) {
                var names = sparta.utils.difference(route.parameters, route.optionalParameters);
                var diff = sparta.utils.difference(names, keys);
                return !diff.length;
            });

            // If we have a matching route, build the URL for it
            if (route) {
                return this._buildUrl(route.route, params);
            }
        },
        go: function(name, params, options) {
            // Get the associated route URL
            var url = this.url(name, params);

            // If a URL exists, navigate to it
            if (sparta.utils.reflect.isString(url)) {
                return this.navigate(url, sparta.utils.extend({
                    trigger: true
                }, options));
            }

            // Otherwise, call the router method, if it exists
            else if (this[name]) {
                return this[name](params);
            }

            // When no method or matching route exists, throw an error
            else {
                throw new Error('No method or matching route exists');
            }
        },
        getRouteInfo: function(routeName) {
            return this._named[routeName][0];
        },
        getRouteParameters: function(routeName) {
            return this._named[routeName][0].parameters;
        }


    });

    Router.extend = extend;

    Router.utils = {

        deparam: function(string) {
            // Extract the key/value pairs
            var items = string.replace(plusPattern, ' ').split('&');

            // Build hash
            var obj = {};
            sparta.utils.each(items, function(params) {
                var param = params.split('=');
                obj[param[0]] = decodeURIComponent(param[1]);
            });
            return obj;
        },
        param: function(obj) {
            // Build param strings
            var params = sparta.utils.map(obj, function(value, key) {
                return key + '=' + encodeURIComponent(value);
            });

            // Create full query param string
            return params.join('&').replace(r20Pattern, '+');
        },
        getQueryString: function(url) {
            var query = url.match(queryStringPattern);
            if (query) {
                return query[0];
            }
        }
    };

    routeManager = sparta.routeManager = (function() {

        // create backbone route
        // for each named route in system
        // add route
        // add default routes

        var SpartaRouter = sparta.Router.extend({}),
            spartaRouter = new SpartaRouter(),
            routeList = {},
            defaultViewInfo = null,
            addRoute = function(viewName, route, routeName) {

                if(!viewName) {
                    throw new Error("Please provide view name");
                }

                if (!routeName) {
                    routeName=viewName;
                }
                
                if (routeList[routeName]) {
                    throw 'Route ' + routeName + ' already exists';
                }

                routeList[routeName] = {
                    routeName: routeName,
                    viewName: viewName,
                    route: route
                };

                spartaRouter.route(route, routeName);

            },
            run = function() {

                var views = sparta.regionManager.getAllViews();

                sparta.utils.each(views, function(view) {
                    if (view.useNameAsRoute === true) {
                        sparta.routeManager.addRoute(view.name, view.routeUrl(), view.name);
                    }
                });

                if (defaultViewInfo) {
                    addRoute(defaultViewInfo.viewName, "", defaultViewInfo.routeName);
                }

                if (sparta.defaults.usePushState === true) {
                    sparta.history.start({
                        pushState: true
                    });
                } else {
                    sparta.history.start();
                }

            },
            buildUrl = function(viewName, params) {
                var url = "/#/" + viewName,
                    qs = "",
                    i = 0;

                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        qs += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
                    }
                }

                if (qs.length > 0) {
                    qs = qs.substring(0, qs.length - 1);
                    url = url + "?" + qs;
                }
                return url;
            },
            navigate = function(routeName, parameters) {
                //
                spartaRouter.go(routeName, parameters);
            },
            initialize = function() {
                // registerDefaultsRoutes();
                // registerRoutes();
                run();
            },
            setDefaultView = function(view) {
                defaultViewInfo = {
                    viewName: view.name,
                    routeName: "system_default_route"
                };
            },
            getRouteInfo = function(routeName) {
                return routeList[routeName];
            },
            getRouteParameters = function(routeName) {
                var parameters = spartaRouter.getRouteParameters(routeName);

                return parameters;
            },
            navToDefaultRoute = function(params) {
                if (defaultViewInfo) {
                    spartaRouter.go(defaultViewInfo.routeName, params);
                } else {
                    sparta.log("Default view has not been set");
                }
            },
            routeNavigated = null;

        spartaRouter.on('system_routed_event', function(name, args) {

            var routeName = name,
                routeParameters = routeManager.getRouteParameters(routeName),
                viewParams = {},
                i = 0,
                paramCount = routeParameters.length,
                argCount = args.length,
                routeInfo = routeManager.getRouteInfo(routeName);

            for (i = 0; i < paramCount; i++) {
                if (i < argCount) {
                    viewParams[routeParameters[i]] = args[i];
                }
            }

            sparta.navManager.onNavigated(routeInfo.viewName, viewParams);

            sparta.debug("route called routeName : " + name + " arguments = " + args);
        });

        return {
            navigate: navigate,
            setDefaultView: setDefaultView,
            initialize: initialize,
            getRouteInfo: getRouteInfo,
            getRouteParameters: getRouteParameters,
            addRoute: addRoute,
            navToDefaultRoute: navToDefaultRoute
        };


    })();

    navManager = sparta.navManager = (function() {
        var nav,
        settings = {
            currentViewName: '',
            navigateCallback: null
        };

        function initialize() {

            // sparta.router.routeNavigated = routeNavigated;
            sparta.routeManager.initialize();
        }


        function back() {

            window.history.back();
            return;
        }

        function navigate(routeName, parameters) {

            sparta.routeManager.navigate(routeName, parameters);
        }

        function navigateDefault(params) {
            sparta.routeManager.navToDefaultRoute(params);
        }
        //navigate no url changes

        function activateView(viewName, parameters, callback) {
            var view = regionManager.findView(viewName);

            if (!view) {
                throw new Error("Unable to find view " + viewName);
            }

            displayViewByName(viewName, parameters, callback);
        }

        function onNavigated(viewName, parameters) {
            displayViewByName(viewName, parameters);
        }

        function displayViewByName(viewName, params, callback) {

            if (typeof callback !== "function") {
                callback = false;
            }

            sparta.viewLoader.loadView(viewName, function(view) {
                if (view) {

                    if (view.viewModel) {
                        if (view.isInit === false) {
                            $.when(view.viewModel.preBind()).then(function() {

                                $.when(view.viewModel.bind(view.el)).then(function() {

                                    $.when(view.viewModel.init()).then(function() {
                                        view.isInit = true;
                                    });
                                });

                            });
                            //view.viewModel.preBind();
                            //view.viewModel.bind(view.el);
                            //view.viewModel.init();
                            //view.isInit = true;
                        }
                    }
                    showView(view, params);
                    if (callback) {
                        callback(view);
                    }
                }
            });
        }

        // Used to preload view

        function preloadView(viewName) {

            return defer(function(deferred) {

                sparta.viewLoader.loadView(viewName, function(view) {
                    try {
                        if (view) {
                            if (view.viewModel) {
                                if (view.isInit === false) {
                                    view.viewModel.init();
                                    view.isInit = true;
                                }
                            }
                            $("#" + view.el).hide();
                        }
                        deferred.resolve(view);
                    } catch (e) {
                        deferred.reject(e);
                    }
                });

            }).promise();
        }

        function showView(view, params) {

            var viewModel;

            hideViewsExcept(view);

            $("#" + view.el).show();

            if (view.isPseudoView) {
                viewModel = view.referenceView.viewModel;
                view.ensureInit();
            } else {
                viewModel = view.viewModel;
            }

            if (viewModel) {
                viewModel.activate(params);
            }
            settings.currentViewName = view.name;

            if (typeof settings.navigateCallback === 'function') {
                settings.navigateCallback(settings.currentViewName);
            }
        }

        function hideViewsExcept(view) {

            var siblingViews, currentView, currentDomObject, i, max,
            unbindFunc = function() {
                $(this).unbind();
            };
            // get views region
            // find views in region
            // hide views in region
            $("#" + view.el).siblings().hide();

            //get all views in same region
            siblingViews = sparta.regionManager.findSiblingViews(view);

            for (i = 0, max = siblingViews.length; i < max; i++) {

                currentView = siblingViews[i];

                if (currentView.isPseudoView) {
                    continue;
                }

                currentDomObject = document.getElementById(currentView.el);

                if (!currentDomObject) {
                    // not loaded. nothing to do
                    continue;
                }

                if (currentView.viewModel) {

                    if (typeof currentView.viewModel.deactivate === 'function') {
                        currentView.viewModel.deactivate();
                    }
                }

                //always recompose view
                if (currentView.recompose === true) {

                    if (currentView.viewModel && typeof currentView.viewModel.destroy === 'function') {
                        currentView.viewModel.destroy();
                    }

                    currentView.isInit = false;

                    var $node = $("#" + currentView.el);

                    $node.find('*').each(unbindFunc);

                    //unbind events
                    // $node.find("*").each(function() {
                    //     $(this).unbind();
                    // });

                    // knockout remove node
                    ko.removeNode(currentDomObject);

                    sparta.viewLoader.removeLoadedView(currentView);
                }

            }
            //check for all views
        }

        function getcurrentNavView() {

            return settings.currentViewName;
        }


        function onNavigatedCallback(callback) {
            if (typeof callback !== "function") {
                callback = false;
            }

            if (callback) {
                callback(settings.currentViewName);
            }
        }

        function getViewModelForView(viewname) {

            var view = regionManager.findView(viewname);

            if (!view) {
                return null;
            }

            return view.viewModel;
        }

        function isViewInit(viewname) {

            var view = regionManager.findView(viewname),
                isInit = false;

            if (view) {
                isInit = view.isInit;
            }

            return isInit;
        }

        return {
            back: back,
            navigate: navigate,
            displayViewByName: displayViewByName,
            getCurrentNavView: getcurrentNavView,
            settings: settings,
            initialize: initialize,
            preloadView: preloadView,
            getViewModelForView: getViewModelForView,
            isViewInit: isViewInit,
            onNavigated: onNavigated,
            navigateToDefault: navigateDefault,
            activateView: activateView

        };

    })();

    sparta.start = function() {
        sparta.navManager.initialize();
    };


    // sparta.History based totally on BackBone.history
    // ----------------

    // Handles cross-browser history management, based on either
    // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
    // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    // and URL fragments. If the browser supports neither (old IE, natch),
    // falls back to polling.
    var History = sparta.History = function() {
        this.handlers = [];
        sparta.utils.bindAll(this, 'checkUrl');

        // Ensure that `History` can be used outside of the browser.
        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
    };

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Has the history handling already been started?
    History.started = false;

    // Set up all inheritable **Backbone.History** properties and methods.
    sparta.utils.extend(History.prototype, Events, {

        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval: 50,

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        getFragment: function(fragment, forcePushState) {
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = this.location.pathname;
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },

        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
        start: function(options) {
            if (History.started) throw new Error("sparta.history has already been started");
            History.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options = sparta.utils.extend({}, {
                root: '/'
            }, this.options, options);
            this.root = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._wantsPushState = !! this.options.pushState;
            this._hasPushState = !! (this.options.pushState && this.history && this.history.pushState);
            var fragment = this.getFragment();
            var docMode = document.documentMode;
            var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            if (oldIE && this._wantsHashChange) {
                this.iframe = sparta.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
                this.navigate(fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (this._hasPushState) {
                sparta.$(window).on('popstate', this.checkUrl); //check sparta
            } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
                sparta.$(window).on('hashchange', this.checkUrl);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            this.fragment = fragment;
            var loc = this.location;
            var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

            // If we've started off with a route from a `pushState`-enabled browser,
            // but we're currently in a browser that doesn't support it...
            if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
                this.fragment = this.getFragment(null, true);
                this.location.replace(this.root + this.location.search + '#' + this.fragment);
                // Return immediately as browser will do redirect to new url
                return true;

                // Or if we've started out with a hash-based route, but we're currently
                // in a browser where it could be `pushState`-based instead...
            } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
                this.fragment = this.getHash().replace(routeStripper, '');
                this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
            }

            if (!this.options.silent) return this.loadUrl();
        },

        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function() {
            sparta.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
            clearInterval(this._checkUrlInterval);
            History.started = false;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({
                route: route,
                callback: callback
            });
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getFragment(this.getHash(this.iframe));
            }
            if (current === this.fragment) return false;
            if (this.iframe) this.navigate(current);
            this.loadUrl() || this.loadUrl(this.getHash());
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride);
            var matched = sparta.utils.any(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
            return matched;
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function(fragment, options) {
            if (!History.started) return false;
            if (!options || options === true) options = {
                trigger: options
            };
            fragment = this.getFragment(fragment || '');
            if (this.fragment === fragment) return;
            this.fragment = fragment;
            var url = this.root + fragment;

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._hasPushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if (!options.replace) this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, fragment, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                return this.location.assign(url);
            }
            if (options.trigger) this.loadUrl(fragment);
        },

        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }

    });

    ViewModel.extend = View.extend = Router.extend = History.extend = extend;

    // Create the default Backbone.history.

    sparta.history = new History;

    //add knockout skip binding
    ko.bindingHandlers.stopBinding = {
        init: function() {
            return {
                controlsDescendantBindings: true
            };
        }
    };

    ko.virtualElements.allowedBindings.stopBinding = true;

    //PubSub based on amplify.js. May be replaced with custom one that implements asnchronouse publishing.
    //http://amplifyjs.com/
    pubsub = function() {

        var slice = [].slice,
            subscriptions = {},
            publish = function(topic) {
                if (typeof topic !== "string") {
                    throw new Error("You must provide a valid topic to publish.");
                }

                var args = slice.call(arguments, 1),
                    topicSubscriptions,
                    subscription,
                    length,
                    i = 0,
                    ret;

                if (!subscriptions[topic]) {
                    return true;
                }

                topicSubscriptions = subscriptions[topic].slice();
                for (length = topicSubscriptions.length; i < length; i++) {
                    subscription = topicSubscriptions[i];
                    ret = subscription.callback.apply(subscription.context, args);
                    if (ret === false) {
                        break;
                    }
                }
                return ret !== false;
            },
            subscribe = function(topic, context, callback, priority) {
                if (typeof topic !== "string") {
                    throw new Error("You must provide a valid topic to create a subscription.");
                }

                if (arguments.length === 3 && typeof callback === "number") {
                    priority = callback;
                    callback = context;
                    context = null;
                }

                if (arguments.length === 2) {
                    callback = context;
                    context = null;
                }

                priority = priority || 10;

                var topicIndex = 0,
                    topics = topic.split(/\s/),
                    topicLength = topics.length,
                    added;

                for (; topicIndex < topicLength; topicIndex++) {
                    topic = topics[topicIndex];
                    added = false;
                    if (!subscriptions[topic]) {
                        subscriptions[topic] = [];
                    }

                    var i = subscriptions[topic].length - 1,
                        subscriptionInfo = {
                            callback: callback,
                            context: context,
                            priority: priority
                        };

                    for (; i >= 0; i--) {
                        if (subscriptions[topic][i].priority <= priority) {
                            subscriptions[topic].splice(i + 1, 0, subscriptionInfo);
                            added = true;
                            break;
                        }
                    }

                    if (!added) {
                        subscriptions[topic].unshift(subscriptionInfo);
                    }
                }

                return callback;
            },

            unsubscribe = function(topic, callback) {
                if (typeof topic !== "string") {
                    throw new Error("You must provide a valid topic to remove a subscription.");
                }

                if (!subscriptions[topic]) {
                    return;
                }

                var length = subscriptions[topic].length,
                    i = 0;

                for (; i < length; i++) {
                    if (subscriptions[topic][i].callback === callback) {
                        subscriptions[topic].splice(i, 1);
                        break;
                    }
                }
            };

        return {
            subscribe: subscribe,
            unsubscribe: unsubscribe,
            publish: publish
        };
    }();


    //simple console logging functionality for logging issues to console based on level
    sparta.logger = function() {
        var noop = function() {};
        if (!window.console) {

            (function() {
                var names = ["log", "debug", "info", "warn", "error",
                    "assert", "dir", "dirxml", "group", "groupEnd", "time",
                    "timeEnd", "count", "trace", "profile", "profileEnd"],
                    i, l = names.length;

                window.console = {};

                for (i = 0; i < l; i++) {
                    window.console[names[i]] = noop;
                }
            }());
        }

        var currentLevel = 1,
            logLevels = {
                "log": 1,
                "debug": 2,
                "info": 3,
                "warn": 4,
                "error": 5
            },
            defaultToLog = false,
            warnFunc,
            debugFunc,
            infoFunc,
            errorFunc,
            logFunc;

        function configureLoggingLevel() {
            if (defaultToLog) {
                warnFunc = debugFunc = infoFunc = errorFunc = logFunc = window.console.log;
            } else {
                warnFunc = window.console.warn;
                debugFunc = window.console.debug;
                infoFunc = window.console.info;
                errorFunc = window.console.error;
                logFunc = window.console.log;
            }
        }

        function call(func, args) {
            if ((Array.prototype.slice.call(args)).length == 1 && typeof Array.prototype.slice.call(args)[0] == 'string') {
                func((Array.prototype.slice.call(args)).toString());
            } else {
                func(Array.prototype.slice.call(args));
            }
        }

        function log() {
            if (currentLevel >= logLevels['log']) {
                call(logFunc, arguments);
            }
        }

        function warn() {
            if (currentLevel >= logLevels['warn']) {
                call(warnFunc, arguments);
            }
        }

        function info() {
            if (currentLevel >= logLevels['info']) {
                call(infoFunc, arguments);
            }
        }

        function debug() {
            if (currentLevel >= logLevels['debug']) {
                call(debugFunc, arguments);
            }
        }

        function error() {
            if (currentLevel >= logLevels['error']) {
                call(errorFunc, arguments);
            }
        }

        function logLevel(level) {
            if (logLevels[level]) {
                currentLevel = logLevels[level];
                configureLoggingLevel();
            } else {
                throw new Error("Logging Level " + level + " not found");
            }
        }

        configureLoggingLevel();

        return {
            log: log,
            warn: warn,
            info: info,
            debug: debug,
            error: error,
            logLevel: logLevel,
            defaultToLog: defaultToLog
        };
    }();

    //shortcuts
    sparta.log = sparta.logger.log;
    sparta.warn = sparta.logger.warn;
    sparta.debug = sparta.logger.debug;
    sparta.error = sparta.logger.error;
    sparta.info = sparta.logger.info;
    sparta.logLevel = sparta.logger.logLevel;
    sparta.defaultToLog = sparta.logger.defaultToLog;

    sparta.publish = pubsub.publish;
    sparta.subscribe = pubsub.subscribe;
    sparta.unsubscribe = pubsub.unsubscribe;
    sparta.linkToUrl = true;

    //shortcuts
    sparta.loadTemplates = sparta.viewLoader.loadTemplates;
    sparta.addRoute = sparta.routeManager.addRoute;
    sparta.setDefaultView = sparta.routeManager.setDefaultView;
    sparta.showView = sparta.navManager.activateView;
    sparta.navigate = sparta.navManager.navigate;
    sparta.registerViewModel = sparta.viewModelLocator.register;
    sparta.findViewModel=sparta.viewModelLocator.find;

    sparta.march = sparta.start; //sorry could not help it

}).call(this, window.ko);