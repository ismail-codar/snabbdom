module.exports = {
    todoStore: require("./store"),

    stopEditing: function(todo, editedTitle) {
        todo.setTitle(editedTitle.value);
        todo.editing = false;
    },

    cancelEditingTodo: function(todo) {
        todo.editing = false;
    },

    updateEditingTodo: function(editedTitle, todo) {
        editedTitle = editedTitle.value.trim();
        todo.editing = false;

        if (editedTitle.length === 0) {
            return this.todoStore.remove(todo.uid);
        }

        todo.setTitle(editedTitle);
    },

    editTodo: function(todo) {
        todo.editing = true;
    },

    removeCompleted: function() {
        this.todoStore.removeCompleted();
    },

    toggleCompletion: function(uid) {
        this.todoStore.toggleCompletion(uid);
    },

    remove: function(uid) {
        this.todoStore.remove(uid);
    },

    addTodo: function($event, newtodo) {
        if ($event.keyCode === 13 && newtodo.value.trim().length) {
            this.todoStore.add(newtodo.value);
            newtodo.value = '';
        }
    }
};