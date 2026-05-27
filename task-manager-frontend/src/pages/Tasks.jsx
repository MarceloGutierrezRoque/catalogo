import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api'

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const getToken = () => localStorage.getItem('token')

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': getToken() }
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      setTasks(data)
    } catch {
      console.error('Error fetching tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken()
        },
        body: JSON.stringify({ title: newTask })
      })

      if (res.ok) {
        const task = await res.json()
        setTasks([task, ...tasks])
        setNewTask('')
      }
    } catch {
      console.error('Error creating task')
    }
  }

  const handleToggleComplete = async (task) => {
    try {
      await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken()
        },
        body: JSON.stringify({ completed: !task.completed })
      })
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } catch {
      console.error('Error updating task')
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() }
      })
      setTasks(tasks.filter(t => t.id !== id))
    } catch {
      console.error('Error deleting task')
    }
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Mis Tareas</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      <form onSubmit={handleCreateTask} className="task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Nueva tarea..."
        />
        <button type="submit">Agregar</button>
      </form>

      {loading ? (
        <p className="empty-tasks">Cargando...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-tasks">No hay tareas. ¡Crea una!</p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className="task-item">
              <input
                type="checkbox"
                className="task-checkbox"
                checked={task.completed}
                onChange={() => handleToggleComplete(task)}
              />
              <div className="task-content">
                <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                  {task.title}
                </span>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="task-delete"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}