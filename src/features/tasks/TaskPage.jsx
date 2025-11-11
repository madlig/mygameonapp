// src/pages/TaskPage/index.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Pastikan path ini benar
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot } 
from '../../config/firebaseConfig';
import { 
  addProject,
  getProjects,
  updateProject,
  deleteProject,
  addTask, // <-- addTask tetap dari service
  updateTask, // <-- updateTask tetap dari service
  deleteTask, 
} from './services/taskProjectService';
// Import komponen modal dan ProjectList
import AddEditProjectModal from './components/AddEditProjectModal';
import AddEditTaskModal from './components/AddEditTaskModal';
import ProjectList from './components/ProjectList';

const TaskPage = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showDailyTasks, setShowDailyTasks] = useState(true); // Default tampilkan Daily Tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentProjectForTask, setCurrentProjectForTask] = useState(null);

  // --- Fetch Projects ---
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('User not authenticated. Please log in.');
      return;
    }

    // Menggunakan getProjects dari service, karena ini sudah berfungsi dengan baik
    const unsubscribeProjects = getProjects(userId, (fetchedProjects) => {
      setProjects(fetchedProjects);
    }, (err) => {
        setError(`Error fetching projects: ${err.message}`);
    });

    return () => {
      if (unsubscribeProjects) unsubscribeProjects();
    };
  }, [userId]);

  // --- Fetch Tasks (Perbaikan utama di sini) ---
  useEffect(() => {
    if (!userId) {
      setTasks([]); // Kosongkan tasks jika tidak ada user
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const tasksCollectionRef = collection(db, `users/${userId}/tasks`);
    let currentQuery;

    if (selectedProjectId) {
      // Query untuk tasks proyek tertentu
      currentQuery = query(
        tasksCollectionRef,
        where("projectId", "==", selectedProjectId),
        where("isDailyTask", "==", false), // Pastikan ini bukan daily task
        orderBy('createdAt', 'desc')
      );
    } else if (showDailyTasks) {
      // Query untuk Daily Tasks
      currentQuery = query(
        tasksCollectionRef,
        where("isDailyTask", "==", true),
        where("projectId", "==", null), // Pastikan tidak ada projectId
        orderBy('createdAt', 'desc')
      );
    } else {
      // Query untuk "All Tasks" (jika tidak ada project atau daily yang dipilih)
      currentQuery = query(
        tasksCollectionRef,
        orderBy('createdAt', 'desc')
      );
    }

    // Menggunakan onSnapshot langsung di sini
    const unsubscribeTasks = onSnapshot(currentQuery, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
      }));
      setTasks(fetchedTasks);
      setLoading(false); // Set loading ke false setelah data diterima
    }, (error) => {
      console.error("Error fetching tasks with onSnapshot: ", error); // Debugging log
      setError(`Failed to load tasks: ${error.message}`);
      setLoading(false);
    });

    // Cleanup function untuk listener tasks
    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [userId, selectedProjectId, showDailyTasks]); // Dependensi useEffect

  // --- Handlers for Project Modals ---
  const handleOpenAddProjectModal = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async (projectName, projectDescription) => {
    if (!userId) {
      setError('User not authenticated.');
      return;
    }
    try {
      if (editingProject) {
        await updateProject(userId, editingProject.id, { name: projectName, description: projectDescription });
      } else {
        await addProject(userId, projectName, projectDescription);
      }
      handleCloseProjectModal();
    } catch (err) {
      setError(`Failed to save project: ${err.message}`);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project and all its associated tasks?")) {
      if (!userId) {
        setError('User not authenticated.');
        return;
      }
      try {
        await deleteProject(userId, projectId);
        if (selectedProjectId === projectId) {
          setSelectedProjectId(null); // Reset selection if current project is deleted
          setShowDailyTasks(true); // Kembali ke daily tasks
        }
      } catch (err) {
        setError(`Failed to delete project: ${err.message}`);
      }
    }
  };

  // --- Handlers for Task Modals ---
  const handleOpenAddTaskModal = (projectId = null) => {
    setEditingTask(null);
    setCurrentProjectForTask(projectId);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setCurrentProjectForTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setCurrentProjectForTask(task.projectId);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    if (!userId) {
      setError('User not authenticated.');
      return;
    }
    try {
      if (editingTask) {
        await updateTask(userId, editingTask.id, taskData);
      } else {
        const finalTaskData = {
          ...taskData,
          projectId: currentProjectForTask || null,
          isDailyTask: currentProjectForTask ? false : taskData.isDailyTask,
        };
        await addTask(userId, finalTaskData);
      }
      handleCloseTaskModal();
    } catch (error) {
      setError(`Failed to save task: ${error.message}`);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    if (!userId) return;
    try {
      let newStatus;
      let newCompletedAt = task.completedAt;

      if (task.status === 'Not Started'){
        newStatus = 'In Progress';
        newCompletedAt = null;
      } else if (task.status === 'In Progress') {
        newStatus = 'Done';
        newCompletedAt = new Date();
      } else if (task.status === 'Done') {
        newStatus = 'Not Started';
        newCompletedAt = null;
      }

      await updateTask(userId, task.id, {
        status: newStatus,
        completedAt: newCompletedAt,
      });
    } catch (error) {
      setError(`Failed to update task status: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      if (!userId) {
        setError('User not authenticated.');
        return;
      }
      try {
        await deleteTask(userId, taskId);
      } catch (err) {
        setError(`Failed to delete task: ${err.message}`);
      }
    }
  };

  // --- UI Handlers ---
  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setShowDailyTasks(false);
  };

  const handleShowDailyTasks = () => {
    setSelectedProjectId(null);
    setShowDailyTasks(true);
  };

  const headerTitle = showDailyTasks
    ? 'Daily Tasks'
    : selectedProjectId
      ? (projects.find(p => p.id === selectedProjectId)?.name || "Project") + " Tasks"
      : 'All Tasks';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-700 text-lg">Loading tasks and projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-6 text-center text-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    // Responsive layout: column on small screens, row on md+
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Left: Projects area (sidebar on md+, top bar on mobile) */}
      <aside className="w-full md:w-1/4 bg-white md:h-auto border-r md:border-r-0 md:border-r md:border-gray-100">
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onShowDailyTasks={handleShowDailyTasks}
          onAddProject={handleOpenAddProjectModal}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{headerTitle}</h1>

          {/* Add New Task: full width on mobile, auto on md+ */}
          <div className="w-full sm:w-auto">
            <button
              onClick={() => handleOpenAddTaskModal(selectedProjectId)}
              className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
            >
              + Add New Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 ? (
            <p className="text-gray-600 col-span-full">No tasks found for this view. Add a new one!</p>
          ) : (
            tasks.map(task => {
              const projectName = task.projectId ? projects.find(p => p.id === task.projectId)?.name : null;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between border-l-4"
                  style={{ borderColor:
                    task.priority === 'High' ? '#ef4444' :
                    task.priority === 'Medium' ? '#f59e0b' :
                    task.priority === 'Low' ? '#3b82f6' :
                    '#cbd5e1'
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 truncate">{task.title}</h3>
                      {projectName && <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">{projectName}</span>}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-700 mb-2 leading-relaxed line-clamp-3">{task.description}</p>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Type: <span className="font-medium text-sm text-purple-600">{task.isDailyTask ? 'Daily Task' : 'Task'}</span></p>
                      <p>Status: <span className={`font-medium ${task.status === 'Done' ? 'text-green-600' : task.status === 'In Progress' ? 'text-yellow-600' : 'text-gray-600'}`}>{task.status}</span></p>
                      <p>Priority: <span className="font-medium">{task.priority}</span></p>
                      {task.createdAt && <p>Created: <span className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</span></p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={() => handleToggleTaskStatus(task)} className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      {task.status === 'Done' ? 'Unmark' : 'Mark Done'}
                    </button>
                    <button onClick={() => handleEditTask(task)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modals */}
      {isProjectModalOpen && (
        <AddEditProjectModal
          isOpen={isProjectModalOpen}
          onClose={handleCloseProjectModal}
          onSave={handleSaveProject}
          initialData={editingProject}
        />
      )}
      {isTaskModalOpen && (
        <AddEditTaskModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          initialData={editingTask}
          currentProjectId={currentProjectForTask}
          currentProjectName={currentProjectForTask ? projects.find(p => p.id === currentProjectForTask)?.name : null}
        />
      )}
    </div>
  );
};

export default TaskPage;