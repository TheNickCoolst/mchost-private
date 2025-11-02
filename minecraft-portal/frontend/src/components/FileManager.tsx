import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Folder,
  File,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  FolderPlus,
  Copy,
  RotateCcw,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: string;
  permissions?: string;
}

interface FileManagerProps {
  serverId: string;
}

const FileManager: React.FC<FileManagerProps> = ({ serverId }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentPath, serverId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/files/${serverId}/list`, {
        params: { path: currentPath }
      });
      setFiles(response.data);
    } catch (error) {
      toast.error('Failed to load files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: FileInfo) => {
    if (folder.isDirectory) {
      setCurrentPath(folder.path);
    }
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath('/' + parts.join('/'));
  };

  const readFile = async (file: FileInfo) => {
    try {
      const response = await api.get(`/api/files/${serverId}/read`, {
        params: { path: file.path }
      });
      setFileContent(response.data.content);
      setEditingFile(file.path);
      setSelectedFile(file);
    } catch (error) {
      toast.error('Failed to read file');
      console.error(error);
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;

    try {
      await api.post(`/api/files/${serverId}/write`, {
        path: editingFile,
        content: fileContent
      });
      toast.success('File saved successfully');
      setEditingFile(null);
      setFileContent('');
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      toast.error('Failed to save file');
      console.error(error);
    }
  };

  const deleteFile = async (file: FileInfo) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      await api.delete(`/api/files/${serverId}`, {
        data: { path: file.path }
      });
      toast.success('Deleted successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await api.post(`/api/files/${serverId}/directory`, {
        path: currentPath,
        name: newFolderName
      });
      toast.success('Folder created successfully');
      setShowNewFolder(false);
      setNewFolderName('');
      loadFiles();
    } catch (error) {
      toast.error('Failed to create folder');
      console.error(error);
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);

    try {
      await api.post(`/api/files/${serverId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('File uploaded successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    }
  };

  const downloadFile = async (file: FileInfo) => {
    try {
      const response = await api.get(`/api/files/${serverId}/download`, {
        params: { path: file.path },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('File downloaded');
    } catch (error) {
      toast.error('Failed to download file');
      console.error(error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          File Manager
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FolderPlus size={18} />
            New Folder
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
            <Upload size={18} />
            Upload File
            <input
              type="file"
              onChange={uploadFile}
              className="hidden"
            />
          </label>
          <button
            onClick={loadFiles}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <RotateCcw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span
          onClick={() => setCurrentPath('/')}
          className="cursor-pointer text-blue-500 hover:underline"
        >
          Root
        </span>
        {currentPath.split('/').filter(Boolean).map((part, index, arr) => (
          <React.Fragment key={index}>
            <span>/</span>
            <span
              onClick={() => {
                const newPath = '/' + arr.slice(0, index + 1).join('/');
                setCurrentPath(newPath);
              }}
              className="cursor-pointer text-blue-500 hover:underline"
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full p-2 border rounded mb-2 dark:bg-gray-600 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={createFolder}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* File Editor */}
      {editingFile && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold dark:text-white">
              Editing: {selectedFile?.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={saveFile}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingFile(null);
                  setFileContent('');
                  setSelectedFile(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <X size={18} />
                Close
              </button>
            </div>
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border rounded dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {/* File List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Size</th>
                <th className="text-left p-2">Modified</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPath !== '/' && (
                <tr
                  onClick={navigateUp}
                  className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 flex items-center gap-2">
                    <Folder size={18} className="text-yellow-500" />
                    <span className="dark:text-white">..</span>
                  </td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                </tr>
              )}
              {files.map((file) => (
                <tr
                  key={file.path}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td
                    onClick={() =>
                      file.isDirectory ? navigateToFolder(file) : readFile(file)
                    }
                    className="p-2 flex items-center gap-2 cursor-pointer"
                  >
                    {file.isDirectory ? (
                      <Folder size={18} className="text-yellow-500" />
                    ) : (
                      <File size={18} className="text-gray-500" />
                    )}
                    <span className="dark:text-white">{file.name}</span>
                  </td>
                  <td className="p-2 dark:text-white">
                    {!file.isDirectory && formatSize(file.size)}
                  </td>
                  <td className="p-2 dark:text-white">
                    {new Date(file.modifiedAt).toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      {!file.isDirectory && (
                        <>
                          <button
                            onClick={() => readFile(file)}
                            className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-1 text-green-500 hover:bg-green-100 rounded"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteFile(file)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FileManager;
