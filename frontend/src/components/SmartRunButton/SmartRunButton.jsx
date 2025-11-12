import { Play, Sparkles, Info } from 'lucide-react';
import { useState } from 'react';
import { detectProjectType, getRunCommandSuggestion } from '../../utils/projectDetector';
import './SmartRunButton.css';

/**
 * Smart Run Button
 * Auto-detects project type and suggests run command
 */
export function SmartRunButton({ 
    files = [], 
    currentFile,
    onRun, 
    disabled = false,
    isRunning = false 
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    // Detect project
    const projectInfo = detectProjectType(files);
    const runCommand = getRunCommandSuggestion(projectInfo);

    function handleClick() {
        if (disabled || isRunning) return;

        // Pass detected info to parent
        onRun({
            projectInfo,
            entryPoint: projectInfo.entryPoint || currentFile,
            language: projectInfo.language,
            command: runCommand
        });
    }

    const isAutoDetected = projectInfo.confidence > 70;

    return (
        <div 
            className="smart-run-button-container"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <button
                className={`smart-run-button ${isAutoDetected ? 'auto-detected' : ''} ${isRunning ? 'running' : ''}`}
                onClick={handleClick}
                disabled={disabled || isRunning}
                title={isAutoDetected ? `Auto-detected: ${projectInfo.type}` : 'Run code'}
            >
                {isAutoDetected && !isRunning && (
                    <Sparkles size={14} className="sparkle-icon" />
                )}
                <Play size={14} className={isRunning ? 'pulse' : ''} />
                <span className="button-text">
                    {isRunning ? 'Running...' : 'Smart Run'}
                </span>
            </button>

            {showTooltip && !isRunning && (
                <div className="run-tooltip">
                    <div className="tooltip-header">
                        <Info size={12} />
                        <span>Detected Configuration</span>
                    </div>
                    <div className="tooltip-content">
                        <div className="tooltip-row">
                            <span className="tooltip-label">Type:</span>
                            <span className="tooltip-value">{projectInfo.type}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Language:</span>
                            <span className="tooltip-value">{projectInfo.language}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Entry:</span>
                            <span className="tooltip-value">{projectInfo.entryPoint}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Confidence:</span>
                            <span className="tooltip-value">{projectInfo.confidence}%</span>
                        </div>
                    </div>
                    <div className="tooltip-command">
                        <code>{runCommand}</code>
                    </div>
                </div>
            )}
        </div>
    );
}
