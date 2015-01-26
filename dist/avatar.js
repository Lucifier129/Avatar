/**
 * Avatar.js
 * @author:Jade Gu
 * @date:2015.01.21
 */
;(function(global, undefined) {
	//base
	function calling(fn) {
		return function() {
			return Function.prototype.call.apply(fn, arguments)
		}
	}

	var objProto = Object.prototype
	var arrProto = Array.prototype
	var toStr = calling(objProto.toString)
	var hasOwn = calling(objProto.hasOwnProperty)
	var slice = calling(arrProto.slice)

	function isType(type) {
		return function(obj) {
			return obj == null ? obj : toStr(obj) === '[object ' + type + ']'
		}
	}

	var isObj = isType('Object')
	var isStr = isType('String')
	var isFn = isType('Function')
	var isArr = Array.isArray

	function each(obj, fn, context) {
		if (obj == undefined || !isFn(fn)) {
			return obj
		}
		var len = obj.length
		var i = 0
		var ret

		if (len === +len && len >= 0) {
			for (; i < len; i += 1) {
				ret = fn.call(context || global, obj[i], i, obj)
				if (ret !== undefined) {
					return ret
				}
			}
			return obj
		}
		var keys = Object.keys(obj)
		var key
		len = keys.length
		for (; i < len; i += 1) {
			key = keys[i]
			ret = fn.call(context || global, obj[key], key, obj)
			if (ret !== undefined) {
				return ret
			}
		}
		return obj
	}

	function extend() {
		var target = arguments[0]
		var deep

		if (typeof target === 'boolean') {
			deep = target
			target = arguments[1]
		}

		if (typeof target !== 'object' && !isFn(target)) {
			return target
		}
		var sourceList = slice(arguments, deep ? 2 : 1)

		each(sourceList, function(source) {

			if (typeof source !== 'object') {
				return
			}

			each(source, function(value, key) {

				if (deep && typeof value === 'object') {
					var oldValue = target[key]

					target[key] = typeof oldValue === 'object' ? oldValue : {}

					return extend(deep, target[key], value)
				}

				target[key] = value
			})
		})

		return target

	}

	function toArr(obj) {
		return isArr(obj) ? obj : [obj]
	}


	function parseChain(chain, separator) {
		return isArr(chain) ? chain : isStr(chain) ? chain.trim().split(separator || '.') : []
	}

	var $proto = {}

	$proto.$define = function(propName, descriptor) {
		if (isObj(propName)) {
			return Object.defineProperties(this, propName)
		} else if (isStr(propName) && isObj(descriptor)) {
			return Object.defineProperty(this, propName, descriptor)
		}
	}

	$proto.$watch = function(propName, fn) {
		if (!isFn(fn)) {
			return this
		}

		var val = this[propName]
		var __events__

		if ('__events__' in this) {
			__events__ = this['__events__']
		} else {
			this.$define('__events__', {
				value: __events__ = {}
			})
		}

		if (!__events__[propName]) {
			__events__[propName] = []
			this.$define(propName, {
				get: function() {
					return val
				},
				set: function(v) {
					var that = this
					each(__events__[propName], function(callback) {
						callback.call(that, v, propName)
					})
					val = v
				}
			})
		}

		__events__[propName].push(fn)

		return this

	}

	$proto.$unwatch = function(propName, fn) {
		var __events__

		if ('__events__' in this) {
			__events__ = this['__events__']
		} else {
			this.$define('__events__', {
				value: __events__ = {}
			})
		}

		if (!(propName in __events__)) {
			return this
		}

		if (fn === undefined) {
			__events__[propName] = []
		} else {
			var index = __events__[propName].indexOf(fn)
			if (index >= 0) {
				__events__[propName].splice(index, 1)
			}
		}

		return this
	}

	$proto.$each = function(iterator) {
		return each(this, iterator, this)
	}

	$proto.$keys = function() {
		return Object.keys(this)
	}

	$proto.$values = function() {
		var result = []
		this.$each(function(value) {
			result.push(value)
		})
		return result
	}

	$proto.$invert = function() {
		var result = {}
		this.$each(function(value, key) {
			result[value] = key
		})
		return result
	}

	$proto.$get = function(propChain, callback) {
		var props = parseChain(propChain, this.separator)
		var result = this
		var iterator
		if (isFn(callback)) {
			var count = 0
			iterator = function(prop) {
				callback(result, prop, props.slice(0, ++count))
				result = result[prop]
				if (result == null) {
					return result
				}
			}
		} else {
			iterator = function(prop) {
				result = result[prop]
				if (result == null) {
					return result
				}
			}
		}
		each(props, iterator)

		return result
	}

	$proto.$scan = function(propChainObj) {
		var that = this
		var result
		if (isStr(propChainObj)) {
			return that.$get(propChainObj)
		} else if (isArr(propChainObj)) {
			result = []
		} else if (isObj(propChainObj)) {
			result = {}
		}
		each(propChainObj, function(propChain, key) {
			result[key] = that.$get(propChain)
		})
		return result
	}

	$proto.$set = function(propChain, val) {

		if (isObj(propChain)) {
			var that = this
			each(propChain, function(value, chain) {
				that.$set(chain, value)
			})
			return this
		}

		var props = parseChain(propChain, this.separator)
		var len = props.length
		if (len === 1) {
			this[props[0]] = val
		} else if (len > 1) {
			var obj = this.$get(props.slice(0, len - 1), function(currentObj, currentProp) {
				if (currentObj[currentProp] == null) {
					currentObj[currentProp] = {}
				}
			})
			obj[props[len - 1]] = val
		}

		return this
	}

	$proto.$call = function(propChain) {

		if (isObj(propChain)) {
			var that = this
			var result = {}
			each(propChain, function(args, chain) {
				args = isArr(args) ? args : [args]
				args.splice(0, 0, chain)
				result[chain] = that.$call.apply(that, args)
			})
			return result
		}

		var props = parseChain(propChain, this.separator)
		var len = props.length
		var method = this.$get(props)
		if (!isFn(method)) {
			return
		}
		obj = this.$get(props.slice(0, len - 1))

		return method.apply(obj, slice(arguments, 1))
	}

	$proto.$extend = function() {
		var args = slice(arguments)
		var len = args.length
		var index = 0
		var propChain = args[index]
		if (typeof propChain === 'boolean') {
			index = 1
			propChain = args[1]
		}

		if (!isStr(propChain) && !isArr(propChain)) {
			if (isObj(propChain)) {
				args.splice(index, 0, this)
			} else {
				return
			}
		} else {
			var target = this.$get(propChain)
			args.splice(index, 1, target)
		}

		extend.apply(global, args)

		return this
	}

	$proto.$unite = function() {
		var that = this
		var args = slice(arguments)
		var len = args.length
		var deep = false
		var source = args[0]

		if (len === 1 && isObj(source)) {
			source.$each(function(value, key) {
				var oldValue = that.$get(key)
				if (isFn(oldValue)) {
					that.$call.apply(that, [key].concat(value))
				} else {
					that.$set(key, value)
				}
			})
		} else if (len > 1) {
			if (typeof source === 'boolean') {
				deep = source
				args.slice(1).$each(function(source) {
					source.$each(function(value, key) {
						var oldValue = that.$get(key)
						if (isFn(oldValue)) {
							that.$call.apply(that, [key].concat(value))
						} else if (isObj(oldValue) && isObj(value)) {
							oldValue.$unite(deep, value)
						} else {
							that.$set(key, value)
						}
					})
				})
			} else {
				args.$each(function(source) {
					that.$unite(source)
				})
			}
		}

		return this
	}

	$proto.$mapping = function(avatar, descriptor, $unite) {
		if (isStr(descriptor)) {
			descriptor = parseDescribeToObj(descriptor)
		}
		var that = this
		var $set
		if (!$unite) {
			$set = function(selfPropChain, val) {
				that.$set(selfPropChain, val)
			}
		} else {
			$set = function(selfPropChain, val) {
				var curVal = that.$get(selfPropChain)
				if (isFn(curVal)) {
					that.$call.apply(that, [selfPropChain].concat(val))
				} else {
					that.$set(selfPropChain, val)
				}
			}
		}
		each(descriptor, function(avatarPropChain, selfPropChain) {
			var props = parseChain(avatarPropChain, avatar.separator)
			var len = props.length
			var propName = props[len - 1]
			var target = avatar.$get(props.slice(0, len - 1))
			var val = target[propName]

			$set(selfPropChain, val)

			target.$watch(propName, function(v) {
				$set(selfPropChain, v)
			})
		})
		return avatar
	}

	$proto.$each(function(method, name) {
		Object.defineProperty(objProto, name, {
			value: method
		})
	})

	if (!global.document) {
		return
	}

	var $elemProto = {}

	$elemProto.$getElementsByDirective = function(directiveName) {
		return this.querySelectorAll('[' + (directiveName || this.directiveName || 'js') + ']') || []
	}

	function parseDescribeToObj(descri) {
		var ret = {}
		if (!isStr(descri)) {
			return ret
		}
		var group = descri.trim().split(';')
		each(group, function(value) {
			value = value.trim().split(':')
			if (value.length < 2) {
				return
			}
			var selfPropChain = value[0].trim()
			var avatarPropChain = value[1].trim()
			if (avatarPropChain && selfPropChain) {
				ret[selfPropChain] = avatarPropChain
			}
		})
		return ret
	}

	$elemProto.$getDirective = function(directiveName) {
		return parseDescribeToObj(this.getAttribute(directiveName || this.directiveName || 'js'))
	}

	$elemProto.$setDirective = function(descriptor, directiveName) {
		this.setAttribute(directiveName || this.directiveName || 'js', descriptor)
		return this
	}

	$elemProto.$mappingAll = function(avatar, descriptorObj, $unite) {
		if (isObj(descriptorObj)) {
			this.$setDirectiveAll(descriptorObj)
		} else if (typeof descriptorObj === 'boolean') {
			$unite = descriptorObj
		}
		var elems = this.$getElementsByDirective()
		each(elems, function(elem) {
			elem.$mapping(avatar, elem.$getDirective(), $unite)
		})
		return avatar
	}

	$elemProto.$setDirectiveAll = function(descriptorObj) {
		var that = this
		each(descriptorObj, function(descriptor, selector) {
			var elems = that.querySelectorAll(selector)
			if (isObj(descriptor)) {
				var _descriptor = ''
				each(descriptor, function(avatarPropChain, selfPropChain) {
					_descriptor += selfPropChain + ':' + avatarPropChain + ';'
				})
				descriptor = _descriptor
			}
			each(elems || [], function(elem) {
				elem.$setDirective(descriptor)
			})
		})
		return this
	}

	$elemProto.$each(function(method, name) {
		Object.defineProperty(Element.prototype, name, {
			value: method,
		})
	})

}(this));