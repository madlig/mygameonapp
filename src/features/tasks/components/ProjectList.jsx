// src/components/ProjectList.jsx

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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Projects</h2>

      {/* Button for Daily Tasks */}
      <button
        onClick={onShowDailyTasks}
        className={`w-full text-left py-3 px-4 rounded-lg mb-3 font-semibold text-lg transition duration-200 ${
          selectedProjectId === null && onShowDailyTasks ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
      >
        Daily Tasks
      </button>

      {/* Project List */}
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
                    className={`p-1 rounded hover:bg-opacity-80 transition-colors duration-200 ${
                      selectedProjectId === project.id ? 'text-white hover:bg-indigo-700' : 'text-gray-600 hover:bg-gray-300'
                    }`}
                    title="Edit Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className={`p-1 rounded hover:bg-opacity-80 transition-colors duration-200 ${
                      selectedProjectId === project.id ? 'text-white hover:bg-indigo-700' : 'text-gray-600 hover:bg-gray-300'
                    }`}
                    title="Delete Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Add Project Button */}
      <button
        onClick={onAddProject}
        className="w-full bg-indigo-500 text-white py-3 px-4 rounded-md hover:bg-indigo-600 transition duration-200 text-lg font-semibold shadow-md"
      >
        + Add New Project
      </button>
    </div>
  );
};

export default ProjectList;