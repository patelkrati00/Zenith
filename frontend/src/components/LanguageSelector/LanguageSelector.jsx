import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, getLanguageDisplayName, getLanguageIcon } from '../../utils/projectDetector';
import './LanguageSelector.css';

/**
 * Language Selector Component
 * Dropdown to select programming language
 */
export function LanguageSelector({ value, onChange, disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { value: LANGUAGES.NODE, label: 'Node.js', icon: '🟢' },
        { value: LANGUAGES.PYTHON, label: 'Python', icon: '🐍' },
        { value: LANGUAGES.CPP, label: 'C++', icon: '⚙️' },
        { value: LANGUAGES.C, label: 'C', icon: '🔧' },
        { value: LANGUAGES.JAVA, label: 'Java', icon: '☕' }
    ];

    const selectedLanguage = languages.find(l => l.value === value) || languages[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    function handleSelect(language) {
        onChange(language.value);
        setIsOpen(false);
    }

    return (
        <div className="language-selector" ref={dropdownRef}>
            <button
                className={`selector-button ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                title="Select language"
            >
                <span className="language-icon">{selectedLanguage.icon}</span>
                <span className="language-label">{selectedLanguage.label}</span>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div className="selector-dropdown">
                    {languages.map((language) => (
                        <button
                            key={language.value}
                            className={`dropdown-item ${value === language.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(language)}
                        >
                            <span className="language-icon">{language.icon}</span>
                            <span className="language-label">{language.label}</span>
                            {value === language.value && (
                                <Check size={14} className="check-icon" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
