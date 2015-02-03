/**
 * tools.js
 */
var app = app || {}

(function(app) {

	var tools = app.tools = {}

	function isType(type) {
		type = '[object ' + type + ']'
		return function(obj) {
			return obj == null ? obj : Object.prototype.toString.call(obj) === type
		}
	}

	var classType = {
		'isObj': 'Object',
		'isArr': 'Array',
		'isStr': 'String',
		'isFn': 'Function',
		'isBln': 'Boolean',
		'isReg': 'RegExp'
	}

	classType.$each(function(type, methodName) {
		tools[methodName] = isType(type)
	})

	tools.$ = function(selector, context) {
		return (context || document).querySelectorAll(selector)
	}

	tools.$on = function(elem, type, fn, capture) {
		elem.addEventListener(type, fn, capture)
	}

	tools.$listen = (function() {

		var eventStore = {}

		function trigger(e) {
			var target = e.target
			var type = e.type
			var events = eventStore[type]

			events.$each(function(entry) {
				var elems = tools.$(entry.selector)
				var isMatch = Array.prototype.indexOf.call(elems, target)
				if (isMatch) {
					entry.callback.call(target, e)
				}
			})
		}

		return function(type, selector, callback) {

			if (typeof type !== 'string' || typeof selector !== 'string' || typeof callback !== 'function') {
				return
			}

			if (!eventStore[type]) {
				eventStore[type] = []
				tools.$on(document, type, trigger, true)
			}
			eventStore[type].push({
				selector: selector,
				callback: callback
			})
		}
	})

}(app));