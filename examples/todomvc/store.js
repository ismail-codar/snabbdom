var uuid = require("./uuid");

function Todo(title) {
    return {
        completed: false,
        editing: false,
        title: title.trim(),
        uid: uuid.v4(),
        setTitle: function (title) {
            this.title = title.trim();
        }
    }
}

module.exports = {
    todos: [],
    init: function () {
		/*
        var persistedTodos = JSON.parse(localStorage.getItem('snabbdom-todos')) || [];
        // Normalize back into classes
        this.todos = persistedTodos.map(function (todo) {
            var ret = Todo(todo.title);
            ret.completed = todo.completed;
            ret.uid = todo.uid;
            return ret;
        });
		*/
    },
    _updateStore: function () {
        //localStorage.setItem('snabbdom-todos', JSON.stringify(this.todos));
    },
    get: function (state) {
        return this.todos.filter(function (todo) {
            return todo.completed === state.completed
        });
    },
    allCompleted: function () {
        return this.todos.length === this.getCompleted().length;
    },
    setAllTo: function (toggler) {
        this.todos.forEach(function (t) {
            t.completed = toggler.checked
        });
        this._updateStore();
    },
    removeCompleted: function () {
        this.todos = this.get({completed: false});
    },
    getRemaining: function () {
        return this.get({completed: false});
    },
    getCompleted: function () {
        return this.get({completed: true});
    },
    toggleCompletion: function (uid) {
        this.todos.forEach(function(todo) {
            if (todo.uid === uid) {
                todo.completed = !todo.completed;
                return;
            }
        });
        this._updateStore();
    },
    remove: function (uid) {
		var todos = this.todos;
        todos.forEach(function(todo) {
            if (todo.uid === uid) {
                todos.splice(todos.indexOf(todo), 1);
                return;
            }
        });
        this._updateStore();
    },
    add: function (title) {
        this.todos.push(Todo(title));
        this._updateStore();
    }
};