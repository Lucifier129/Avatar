/**
 * view.js
 */
var app = app || {};

(function(app) {

	var tools = app.tools

	var todoTemplate =
		'<li class="{{ completed }}" data-id="{{ id }}">\
			<div class="view">\
				<input class="toggle" type="checkbox" {{ checked }}>\
				<label>{{ title }}</label>\
				<button class="destroy"></button>\
			</div>\
			<input class="edit">\
		</li>'

	function TodoList(todos) {
		this.todos = todos
		this.result = ''
	}

	TodoList.prototype = {

		containerId: 'todo-list',

		template: todoTemplate,

		complie: function(todo) {
			var template = this.template

			template = template.replace('{{ id }}', todo.id || '')

			template = template.replace('{{ completed }}', todo.completed ? 'completed' : '')

			template = template.replace('{{ checked }}', todo.completed ? 'checked' : '')

			template = template.replace('{{ title }}', todo.title || '')

			this.result += template
		},

		render: function(todos) {
			(todos || this.todos).forEach(function(todo) {
				this.complie(todo)
			}.bind(this))
			document.getElementById(this.containerId).innerHTML = this.result
		}
	}

	function Editor(elem) {
		this.elem = elem
		this.label = this.$find('label')
		this.edit = this.$find('edit')
	}

	Editor.prototype = {

		$find: function(selector) {
			return tools.$(selector, this.elem)
		},

		start: function() {
			this.elem.classList.add('editing')
			this.oldValue = this.edit.value = this.label.textContent
			this.edit.focus()
		},

		end: function() {
			var newValue = this.edit.value
			if (!newValue) {
				var id = this.elem.dataset['id']
				this.elem.parentNode.removeChild(this.elem)
				return id
			} else if (newValue !== this.oldValue) {
				this.label.textContent = newValue
			}
			this.elem.classList.remove('editing')
		}
	}

	app.View = {
		TodoList: TodoList,
		Editor: Editor
	}

}(app));