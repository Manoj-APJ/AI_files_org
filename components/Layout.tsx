import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, Menu, X, LogOut, Home, Settings, 
  HelpCircle, User, Moon, Sun
} from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-brand-gray-900 text-white' : 'bg-white'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 shadow-lg transform transition-transform duration-200 ease-in-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${darkMode ? 'bg-brand-gray-800' : 'bg-white'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center group">
              <div className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-brand-yellow-400/20 group-hover:bg-brand-yellow-400/30' 
                  : 'bg-brand-yellow-100 group-hover:bg-brand-yellow-200'
              }`}>
                <BookOpen className={`h-6 w-6 ${
                  darkMode ? 'text-brand-yellow-400' : 'text-brand-yellow-600'
                }`} />
              </div>
              <span className={`ml-3 text-xl font-bold ${
                darkMode ? 'text-white' : 'text-brand-gray-900'
              }`}>NoteGenius</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="space-y-2">
            <Link 
              to="/"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-white hover:bg-brand-gray-700' 
                  : 'text-brand-gray-700 hover:bg-brand-gray-100'
              }`}
            >
              <Home className="h-5 w-5 mr-3" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <button 
              className={`flex items-center px-4 py-3 rounded-lg w-full text-left transition-colors ${
                darkMode 
                  ? 'text-white hover:bg-brand-gray-700' 
                  : 'text-brand-gray-700 hover:bg-brand-gray-100'
              }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              <span className="font-medium">Settings</span>
            </button>
            <button 
              className={`flex items-center px-4 py-3 rounded-lg w-full text-left transition-colors ${
                darkMode 
                  ? 'text-white hover:bg-brand-gray-700' 
                  : 'text-brand-gray-700 hover:bg-brand-gray-100'
              }`}
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              <span className="font-medium">Help & Support</span>
            </button>
          </nav>
        </div>
        
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
          darkMode ? 'border-brand-gray-700' : 'border-brand-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-brand-gray-700 text-brand-yellow-300 hover:bg-brand-gray-600' 
                  : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
              }`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button 
              onClick={handleLogout}
              className={`flex items-center p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-brand-yellow-400/20 text-brand-yellow-200 hover:bg-brand-yellow-400/30' 
                  : 'bg-brand-yellow-100 text-brand-yellow-700 hover:bg-brand-yellow-200'
              }`}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          
          <div className={`flex items-center p-3 rounded-lg ${
            darkMode ? 'bg-brand-gray-700' : 'bg-brand-gray-100'
          }`}>
            <div className={`p-2 rounded-full ${
              darkMode ? 'bg-brand-gray-600' : 'bg-brand-gray-200'
            }`}>
              <User className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                darkMode ? 'text-white' : 'text-brand-gray-900'
              }`}>{user?.email}</p>
              <p className={`text-xs ${
                darkMode ? 'text-brand-gray-400' : 'text-brand-gray-500'
              }`}>
                Free Plan
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <div className={`sticky top-0 z-10 ${
          darkMode ? 'bg-brand-gray-800 border-brand-gray-700' : 'bg-white border-brand-gray-200'
        } border-b shadow-sm`}>
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 lg:ml-4 flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                darkMode ? 'bg-brand-yellow-400/20' : 'bg-brand-yellow-100'
              }`}>
                <BookOpen className={`h-6 w-6 ${
                  darkMode ? 'text-brand-yellow-400' : 'text-brand-yellow-600'
                }`} />
              </div>
              <h1 className={`text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-brand-gray-900'
              }`}>NoteGenius</h1>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className={`p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-brand-gray-900' : 'bg-white'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;