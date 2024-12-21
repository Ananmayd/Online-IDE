import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../../constants/index';

interface CreateProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateProject: (name: string, language: Language) => void;
}

const languages: Language[] = [
    "PYTHON",
    "NODEJS",
    "CPP",
];

export function CreateProjectDialog({ isOpen, onClose, onCreateProject }: CreateProjectDialogProps) {
    const [projectName, setProjectName] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectName.trim()) {
            onCreateProject(projectName, selectedLanguage);
            setProjectName('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter project name"
                        />
                    </div>

                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                            Language
                        </label>
                        <select
                            id="language"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {languages.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Create Project
                    </button>
                </form>
            </div>
        </div>
    );
}