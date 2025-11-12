import { useState } from 'react';
import { FileCode, X } from 'lucide-react';
import { getAllTemplates } from '../../utils/projectTemplates';
import './TemplateSelector.css';

/**
 * Template Selector Modal
 * Choose from pre-configured project templates
 */
export function TemplateSelector({ isOpen, onClose, onSelect }) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const templates = getAllTemplates();

    if (!isOpen) return null;

    function handleSelect() {
        if (selectedTemplate) {
            onSelect(selectedTemplate);
            onClose();
        }
    }

    return (
        <div className="template-modal-overlay" onClick={onClose}>
            <div className="template-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-title">
                        <FileCode size={20} />
                        <h2>Choose a Template</h2>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Template Grid */}
                <div className="template-grid">
                    {templates.map((template) => (
                        <button
                            key={template.id}
                            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className="template-icon">{template.icon}</div>
                            <div className="template-name">{template.name}</div>
                            <div className="template-language">{template.language}</div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSelect}
                        disabled={!selectedTemplate}
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
}
