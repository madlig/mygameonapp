// src/components/AddEditTaskModal.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AddEditTaskModal = ({ isOpen, onClose, onSave, initialData, currentProjectId, currentProjectName }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Not Started');
  const [isDailyTask, setIsDailyTask] = useState(false);
  // --- TAMBAHAN BARU ---
  const [location, setLocation] = useState(''); // State untuk lokasi task
  const [taskType, setTaskType] = useState(''); // State untuk jenis task

  // Definisikan opsi untuk dropdown lokasi dan jenis task
  const locationOptions = ["", "Dashboard Page", "Games Page", "Tasks Page", "Requests Page", "Operational Page", "Feedback Page", "About Page", "Others"]; // Tambahkan opsi sesuai kebutuhan
  const taskTypeOptions = ["", "Bug", "Feature", "Maintenance", "Research", "Testing", "Documentation", "Others"]; // Tambahkan opsi sesuai kebutuhan
  // --- AKHIR TAMBAHAN BARU ---

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDeadline(initialData.deadline ? new Date(initialData.deadline) : null);
      setPriority(initialData.priority || 'Medium');
      setStatus(initialData.status || 'Not Started');
      setIsDailyTask(initialData.isDailyTask || false);
      // --- TAMBAHAN BARU (untuk mengisi saat edit) ---
      // Asumsi location dan taskType juga disimpan di initialData
      setLocation(initialData.location || '');
      setTaskType(initialData.taskType || '');
      // --- AKHIR TAMBAHAN BARU ---
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
      // --- TAMBAHAN BARU (untuk mengosongkan saat tambah baru) ---
      setLocation(''); // Reset lokasi untuk task baru
      setTaskType(''); // Reset jenis task untuk task baru
      // --- AKHIR TAMBAHAN BARU ---
    }
  }, [initialData, currentProjectId, currentProjectName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    // --- PERUBAHAN UTAMA: Membangun judul task lengkap ---
    let finalTitle = title.trim();
    if (location) {
      finalTitle = `[${location}] ${finalTitle}`;
    }
    if (taskType) {
      finalTitle = `[${taskType}] ${finalTitle}`;
    }
    if (currentProjectId && currentProjectName) { // Project abbreviation
        const projectAbbr = currentProjectName.match(/\b(\w)/g).join('').toUpperCase();
        finalTitle = `[${projectAbbr}] ${finalTitle}`;
    }
    // --- AKHIR PERUBAHAN UTAMA ---

    const taskData = {
      title: finalTitle, // Menggunakan finalTitle yang sudah dibentuk
      description,
      deadline: deadline,
      priority,
      status,
      isDailyTask: currentProjectId ? false : isDailyTask,
      // --- TAMBAHAN BARU ---
      location, // Simpan juga lokasi
      taskType, // Simpan juga jenis task
      // --- AKHIR TAMBAHAN BARU ---
    };

    onSave(taskData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Task' : 'Add New Task'}</h2>
        <form onSubmit={handleSubmit}>
          {/* --- TAMBAHAN BARU: Field Lokasi --- */}
          <div className="mb-4">
            <label htmlFor="taskLocation" className="block text-gray-700 text-sm font-bold mb-2">
              Location (Optional):
            </label>
            <select
              id="taskLocation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {locationOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* --- AKHIR TAMBAHAN BARU --- */}

          {/* --- TAMBAHAN BARU: Field Jenis Task --- */}
          <div className="mb-4">
            <label htmlFor="taskType" className="block text-gray-700 text-sm font-bold mb-2">
              Task Type (Optional):
            </label>
            <select
              id="taskType"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {taskTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* --- AKHIR TAMBAHAN BARU --- */}

          {/* Field Task Title (penting: ini hanya input judul 'inti', bukan yang sudah ada prefix) */}
          <div className="mb-4">
            <label htmlFor="taskTitle" className="block text-gray-700 text-sm font-bold mb-2">
              Task Title:
            </label>
            <input
              type="text"
              id="taskTitle"
              value={title} // Ini hanya menampilkan judul inti yang akan ditambahkan prefix saat submit
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., Fix login bug" // Contoh placeholder
              required
            />
             {/* Preview judul lengkap, opsional */}
            {currentProjectId && currentProjectName && (location || taskType) && (
                <p className="text-xs text-gray-500 mt-1">
                    Preview:
                    `[${currentProjectName.match(/\b(\w)/g).join('').toUpperCase()}] ${location ? `[${location}] ` : ''}${taskType ? `[${taskType}] ` : ''}`
                </p>
            )}
             {!currentProjectId && (location || taskType) && (
                <p className="text-xs text-gray-500 mt-1">
                    Preview:
                    ` ${location ? `[${location}] ` : ''}${taskType ? `[${taskType}] ` : ''}`
                </p>
            )}

          </div>

          {/* ... (field lainnya seperti Description, Deadline, Priority, Status, isDailyTask) */}
          <div className="mb-4">
            <label htmlFor="taskDescription" className="block text-gray-700 text-sm font-bold mb-2">
              Description (Optional):
            </label>
            <textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
              rows="3"
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="deadline" className="block text-gray-700 text-sm font-bold mb-2">
              Deadline (Optional):
            </label>
            <DatePicker
              selected={deadline}
              onChange={(date) => setDeadline(date)}
              dateFormat="Pp"
              showTimeSelect
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              wrapperClassName="w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">
              Priority:
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
              Status:
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          {!currentProjectId && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isDailyTask"
                checked={isDailyTask}
                onChange={(e) => setIsDailyTask(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isDailyTask" className="text-gray-700 text-sm font-bold">
                Is this a Daily Task?
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
            >
              {initialData ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTaskModal;