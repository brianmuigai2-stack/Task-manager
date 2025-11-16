import React, { useState } from 'react';

const TaskForm = ({ onAddTask, categories }) => {
  const [task, setTask] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [recurrence, setRecurrence] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    onAddTask({
      text: task,
      notes,
      dueDate,
      category,
      priority,
      recurrence,
      completed: false,
      createdAt: new Date()
    });

    setTask('');
    setNotes('');
    setDueDate('');
    setCategory('');
    setPriority('medium');
    setRecurrence('');
  };

  return (
    <form id="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        required
      />
      <textarea
        placeholder="Add notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="form-row">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">No Category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>
      <div className="form-row">
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="">Does Not Repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button type="submit">Add Task</button>
      </div>
    </form>
  );
};

export default TaskForm;