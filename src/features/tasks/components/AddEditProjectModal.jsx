import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';

const AddEditProjectModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setProjectName(initialData.name || '');
      setProjectDescription(initialData.description || '');
    } else {
      setProjectName('');
      setProjectDescription('');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Project name cannot be empty.');
      return;
    }
    onSave(projectName, projectDescription);
  };

  return (
    <Modal onClose={onClose} ariaLabel={initialData ? "Edit Project" : "Add Project"}>
      <div className="p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Project' : 'Add New Project'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">Project Name:</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="projectDescription" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Cancel</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              {initialData ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEditProjectModal;