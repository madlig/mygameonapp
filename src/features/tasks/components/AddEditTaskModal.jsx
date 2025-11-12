// src/components/AddEditTaskModal.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Modal from '../../../components/common/Modal';

const AddEditTaskModal = ({ isOpen, onClose, onSave, initialData, currentProjectId, currentProjectName }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Not Started');
  const [isDailyTask, setIsDailyTask] = useState(false);
  const [location, setLocation] = useState('');
  const [taskType, setTaskType] = useState('');

  const locationOptions = ["", "Dashboard Page", "Games Page", "Tasks Page", "Requests Page", "Operational Page", "Feedback Page", "About Page","Landing Page", "Others"];
  const taskTypeOptions = ["", "Bug", "Feature", "Maintenance", "Research", "Testing", "Documentation", "Others"];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDeadline(initialData.deadline ? new Date(initialData.deadline) : null);
      setPriority(initialData.priority || 'Medium');
      setStatus(initialData.status || 'Not Started');
      setIsDailyTask(initialData.isDailyTask || false);
      setLocation(initialData.location || '');
      setTaskType(initialData.taskType || '');
    } else {
      let defaultTitle = '';
      if (currentProjectId && currentProjectName) {
        const projectAbbr = currentProjectName.match(/\b(\w)/g).join('').toUpperCase();
        defaultTitle = `[${projectAbbr}] `;
      }
      setTitle(defaultTitle);
      setDescription('');
      setDeadline(null);
      setPriority('Medium');
      setStatus('Not Started');
      setIsDailyTask(!currentProjectId);
      setLocation('');
      setTaskType('');
    }
  }, [initialData, currentProjectId, currentProjectName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    let finalTitle = title.trim();
    if (location) finalTitle = `[${location}] ${finalTitle}`;
    if (taskType) finalTitle = `[${taskType}] ${finalTitle}`;
    if (currentProjectId && currentProjectName) {
      const projectAbbr = currentProjectName.match(/\b(\w)/g).join('').toUpperCase();
      finalTitle = `[${projectAbbr}] ${finalTitle}`;
    }

    const taskData = {
      title: finalTitle,
      description,
      deadline,
      priority,
      status,
      isDailyTask: currentProjectId ? false : isDailyTask,
      location,
      taskType,
    };

    onSave(taskData);
  };

  return (
    <Modal onClose={onClose} ariaLabel={initialData ? "Edit Task" : "Add Task"}>
      <div className="p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Task' : 'Add New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Location (Optional):</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded p-2">
              {locationOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Task Type (Optional):</label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full border rounded p-2">
              {taskTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Task Title:</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" required />
            {currentProjectId && currentProjectName && (location || taskType) && (
              <p className="text-xs text-gray-500 mt-1">
                Preview: [{currentProjectName.match(/\b(\w)/g).join('').toUpperCase()}] {location ? `[${location}] ` : ''}{taskType ? `[${taskType}] ` : ''}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded p-2 resize-y" rows="3"></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Deadline (Optional):</label>
            <DatePicker selected={deadline} onChange={(date) => setDeadline(date)} showTimeSelect className="w-full border rounded p-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Priority:</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border rounded p-2">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded p-2">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          {!currentProjectId && (
            <div className="mb-4 flex items-center mt-4">
              <input type="checkbox" checked={isDailyTask} onChange={(e) => setIsDailyTask(e.target.checked)} className="mr-2" />
              <label className="text-gray-700 text-sm font-bold">Is this a Daily Task?</label>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">{initialData ? 'Update Task' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEditTaskModal;