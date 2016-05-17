!(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
            return factory($ || root.$)
        });
    }
    else if (typeof exports !== 'undefined' && typeof module === 'object') {
        module.exports = factory;
    }
    else if (typeof root.$ !== 'undefined' || typeof root.jQuery !== 'undefined') {
        factory(root.$ || root.jQuery);
    }
}(this, function($) {
    $.i18n = {};
    $.i18n.map = {};
    $.i18n.dictionaries = {};

    var defaults = {
        name: 'ui-messages',
        language: '',
        defaultLanguage: 'en',
        path: '',
        callback: null
    };

    $.i18n.initialize = function (settings) {
        settings = $.extend(defaults, settings);

        if (!settings.language) {
            settings.language = getBrowserLang();
        }

        var locale = settings.language.substring(0, 2);
        var currentFileName = settings.path + settings.name + '_' + locale + '.json';

        return $.when(getCurrentLanguage(currentFileName)).then(
            function (currentLanguage) {
                $.i18n.map = currentLanguage;

                settings.callback();
            },
            function () {
                console.error('something goes wrong');
            }
        );
    };

    $.i18n.getDictionaries = function (settings) {
        settings = $.extend(defaults, settings);

        if (!settings.language.length) {
            settings.language[0] = getBrowserLang();
        }

        var prevDictionaries = Object.keys($.i18n.dictionaries);
        var deferreds = [];
        var locale;
        var currentFileName;
        var promise;

        defaults.language.forEach(function (item) {
            if (Object.keys($.i18n.dictionaries).indexOf(item) >= 0 || item === settings.defaultLanguage) {
                settings.callback();
                return;
            }

            locale = item.substring(0, 2);
            currentFileName = settings.path + settings.name + '_' + locale + '.json';

            deferreds.push(getCurrentLanguage(currentFileName));
        });

        if (deferreds.length) {
            promise = $.when.apply($, deferreds).then(
                function() {
                    var argumentsArr = Array.prototype.slice.call(arguments);

                    defaults.language.forEach(function (locale, index) {
                        if (Object.prototype.toString.call(argumentsArr[0]) === '[object Array]') {
                            $.i18n.dictionaries[locale] = argumentsArr[index][0];
                        }
                        else {
                            $.i18n.dictionaries[locale] = argumentsArr[0];
                        }
                    });

                    return settings.callback();
                },
                function() {
                    console.log('something goes wrong');
                }
            );
        }
        else {
            promise = $.when(true).then(function() {
                return settings.callback();
            });
        }

        // Remove previous dictionaries
        for (var item in $.i18n.dictionaries) {
            if (item === settings.defaultLanguage) {
                break;
            }

            if (prevDictionaries.indexOf(item) >= 0) {
                delete $.i18n.dictionaries[item]
            }
        }

        return promise;
    };

    $.i18n.t = function (key) {
        var methodArguments = arguments;
        var parsedStr;
        var value = $.i18n.map[key];

        if (value == null) {
            parsedStr = '[' + key + ']';
        }
        else if ('string' === typeof value) {
            parsedStr = value.replace(new RegExp('\{([0-9]+?)\}', 'gm'), function (comparison, digit) {
                var digit = parseInt(digit);

                return (digit + 1 < methodArguments.length) ? methodArguments[digit + 1] : comparison;
            });
        }
        else {
            parsedStr = value;
        }

        return parsedStr;
    };

    $.i18n.mT = function(locale, key) {
        var parsedStr,
            dictionary = $.i18n.dictionaries[locale];

        if (dictionary && dictionary[key]) {
            parsedStr = dictionary[key];
        }
        else if ($.i18n.map[key]) {
            parsedStr = $.i18n.map[key];
        }
        else {
            parsedStr = '[' + key + ']';
        }

        return parsedStr;
    };

    function getBrowserLang() {
        var locale = navigator.language || navigator.userLanguage;

        function normaliseLanguageCode(lang) {
            return lang.toLowerCase().substring(0, 2);
        }

        return normaliseLanguageCode(locale);
    }

    function getCurrentLanguage(filename) {
        return $.ajax({
            url: filename,
            contentType: 'application/json',
            dataType: 'json'
        });
    }

    $.fn.translate = function(locale) {
        var key = this.html();

        if (locale === undefined) {
            this.html($.i18n.t(key));
        }
        else {
            this.html($.i18n.mT(locale, key));
        }

        return this;
    };

    return $;
}));


