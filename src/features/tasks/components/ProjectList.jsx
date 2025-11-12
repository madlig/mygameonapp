// src/components/ProjectList.jsx
import React from 'react';

const ProjectList = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onShowDailyTasks,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  return (
    <div className="p-4">
      {/* Mobile: horizontal pill list */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Projects</h2>
          <button onClick={onAddProject} className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm">+ Project</button>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2">
          <button
            onClick={() => { onShowDailyTasks(); }}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium ${selectedProjectId === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            Daily Tasks
          </button>

          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${selectedProjectId === project.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              title={project.name}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop / md+: vertical sidebar */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Projects</h2>

        {/* Button for Daily Tasks */}
        <button
          onClick={onShowDailyTasks}
          className={`w-full text-left py-3 px-4 rounded-lg mb-3 font-semibold text-lg transition duration-200 ${selectedProjectId === null ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
        >
          Daily Tasks
        </button>

        <ul className="space-y-2 mb-6">
          {projects.length === 0 ? (
            <li className="text-gray-500 italic">No projects added yet.</li>
          ) : (
            projects.map(project => (
              <li key={project.id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition duration-200
                    ${selectedProjectId === project.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`
                  }
                  onClick={() => onSelectProject(project.id)}
                >
                  <span className="font-medium text-lg truncate">{project.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                      className={`p-1 rounded hover:bg-opacity-80 transition-colors duration-200 ${selectedProjectId === project.id ? 'text-white hover:bg-indigo-700' : 'text-gray-600 hover:bg-gray-300'}`}
                      title="Edit Project"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className={`p-1 rounded hover:bg-opacity-80 transition-colors duration-200 ${selectedProjectId === project.id ? 'text-white hover:bg-indigo-700' : 'text-gray-600 hover:bg-gray-300'}`}
                      title="Delete Project"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        <button
          onClick={onAddProject}
          className="w-full bg-indigo-500 text-white py-3 px-4 rounded-md hover:bg-indigo-600 transition duration-200 text-lg font-semibold shadow-md"
        >
          + Add New Project
        </button>
      </div>
    </div>
  );
};

export default ProjectList;