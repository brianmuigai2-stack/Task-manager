import React from 'react';

const TaskList = ({ tasks, onToggleTask, onDeleteTask, onEditTask, onStartPomodoro, filter, searchTerm, categoryFilter }) => {
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && !task.completed) || 
      (filter === 'completed' && task.completed);
    
    const matchesSearch = !searchTerm || 
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    
    return matchesFilter && matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate, completed) => {
    if (!dueDate || completed) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <ul id="task-list">
      {filteredTasks.map(task => (
        <li 
          key={task.id} 
          className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate, task.completed) ? 'overdue' : ''}`}
        >
          <div className="task-main-content">
            <input
              type="checkbox"
              className="task-checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />
            <div className="task-content">
              <div className="task-text" onClick={() => onEditTask(task)}>
                {task.text}
              </div>
              {task.notes && (
                <div className="task-notes" onClick={() => onEditTask(task)}>
                  {task.notes}
                </div>
              )}
            </div>
            <div className="task-meta">
              {task.dueDate && <span>📅 {formatDate(task.dueDate)}</span>}
              {task.category && <span>🏷️ {task.category}</span>}
              <span className={`task-priority priority-${task.priority}`}>
                {task.priority}
              </span>
            </div>
            <button 
              className="pomodoro-btn" 
              onClick={() => onStartPomodoro(task)}
              title="Start Pomodoro"
            >
              <i className="fas fa-clock"></i>
            </button>
            <button 
              className="edit-task-btn" 
              onClick={() => onEditTask(task)}
              title="Edit task"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              className="delete-btn" 
              onClick={() => onDeleteTask(task.id)}
              title="Delete task"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;