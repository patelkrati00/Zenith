/**
 * Project Detection Utility
 * Automatically detects project type and configuration
 */

export const LANGUAGES = {
    JAVASCRIPT: 'javascript',
    NODE: 'node',
    PYTHON: 'python',
    CPP: 'cpp',
    C: 'c',
    JAVA: 'java'
};

export const PROJECT_TYPES = {
    NODE_PROJECT: 'node_project',
    PYTHON_PROJECT: 'python_project',
    CPP_PROJECT: 'cpp_project',
    JAVA_PROJECT: 'java_project',
    SINGLE_FILE: 'single_file'
};

/**
 * Detect project type from file structure
 */
export function detectProjectType(files) {
    if (!files || files.length === 0) {
        return { type: PROJECT_TYPES.SINGLE_FILE, confidence: 0 };
    }

    const fileNames = files.map(f => f.name.toLowerCase());
    
    // Node.js project detection
    if (fileNames.includes('package.json')) {
        return {
            type: PROJECT_TYPES.NODE_PROJECT,
            language: LANGUAGES.NODE,
            confidence: 100,
            entryPoint: findNodeEntryPoint(files)
        };
    }

    // Python project detection
    if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py')) {
        return {
            type: PROJECT_TYPES.PYTHON_PROJECT,
            language: LANGUAGES.PYTHON,
            confidence: 100,
            entryPoint: findPythonEntryPoint(files)
        };
    }

    // C++ project detection
    if (fileNames.includes('makefile') || fileNames.includes('cmakelists.txt')) {
        return {
            type: PROJECT_TYPES.CPP_PROJECT,
            language: LANGUAGES.CPP,
            confidence: 100,
            entryPoint: findCppEntryPoint(files)
        };
    }

    // Java project detection
    if (fileNames.includes('pom.xml') || fileNames.some(f => f.endsWith('.java'))) {
        return {
            type: PROJECT_TYPES.JAVA_PROJECT,
            language: LANGUAGES.JAVA,
            confidence: fileNames.includes('pom.xml') ? 100 : 80,
            entryPoint: findJavaEntryPoint(files)
        };
    }

    // Single file detection
    return detectSingleFile(files);
}

/**
 * Find Node.js entry point
 */
function findNodeEntryPoint(files) {
    // Check package.json for main field
    const packageJson = files.find(f => f.name === 'package.json');
    if (packageJson && packageJson.content) {
        try {
            const pkg = JSON.parse(packageJson.content);
            if (pkg.main) return pkg.main;
        } catch (e) {
            // Invalid JSON, continue
        }
    }

    // Common entry points
    const entryPoints = ['index.js', 'main.js', 'app.js', 'server.js'];
    for (const entry of entryPoints) {
        if (files.some(f => f.name === entry)) {
            return entry;
        }
    }

    // First .js file
    const jsFile = files.find(f => f.name.endsWith('.js'));
    return jsFile ? jsFile.name : 'index.js';
}

/**
 * Find Python entry point
 */
function findPythonEntryPoint(files) {
    // Common entry points
    const entryPoints = ['main.py', 'app.py', '__main__.py', 'run.py'];
    for (const entry of entryPoints) {
        if (files.some(f => f.name === entry)) {
            return entry;
        }
    }

    // First .py file
    const pyFile = files.find(f => f.name.endsWith('.py'));
    return pyFile ? pyFile.name : 'main.py';
}

/**
 * Find C++ entry point
 */
function findCppEntryPoint(files) {
    // Common entry points
    const entryPoints = ['main.cpp', 'main.cc', 'app.cpp'];
    for (const entry of entryPoints) {
        if (files.some(f => f.name === entry)) {
            return entry;
        }
    }

    // First .cpp file
    const cppFile = files.find(f => f.name.endsWith('.cpp') || f.name.endsWith('.cc'));
    return cppFile ? cppFile.name : 'main.cpp';
}

/**
 * Find Java entry point
 */
function findJavaEntryPoint(files) {
    // Look for main method in files
    for (const file of files) {
        if (file.name.endsWith('.java') && file.content) {
            if (file.content.includes('public static void main')) {
                return file.name;
            }
        }
    }

    // Common entry points
    const entryPoints = ['Main.java', 'App.java', 'Application.java'];
    for (const entry of entryPoints) {
        if (files.some(f => f.name === entry)) {
            return entry;
        }
    }

    // First .java file
    const javaFile = files.find(f => f.name.endsWith('.java'));
    return javaFile ? javaFile.name : 'Main.java';
}

/**
 * Detect single file project
 */
function detectSingleFile(files) {
    if (files.length === 0) {
        return {
            type: PROJECT_TYPES.SINGLE_FILE,
            language: LANGUAGES.JAVASCRIPT,
            confidence: 0,
            entryPoint: 'index.js'
        };
    }

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    const languageMap = {
        'js': LANGUAGES.JAVASCRIPT,
        'py': LANGUAGES.PYTHON,
        'cpp': LANGUAGES.CPP,
        'cc': LANGUAGES.CPP,
        'c': LANGUAGES.C,
        'java': LANGUAGES.JAVA
    };

    return {
        type: PROJECT_TYPES.SINGLE_FILE,
        language: languageMap[ext] || LANGUAGES.JAVASCRIPT,
        confidence: languageMap[ext] ? 90 : 50,
        entryPoint: file.name
    };
}

/**
 * Detect language from filename
 */
export function detectLanguageFromFilename(filename) {
    if (!filename) return LANGUAGES.JAVASCRIPT;

    const ext = filename.split('.').pop().toLowerCase();

    const extensionMap = {
        'js': LANGUAGES.JAVASCRIPT,
        'mjs': LANGUAGES.NODE,
        'cjs': LANGUAGES.NODE,
        'py': LANGUAGES.PYTHON,
        'cpp': LANGUAGES.CPP,
        'cc': LANGUAGES.CPP,
        'cxx': LANGUAGES.CPP,
        'c': LANGUAGES.C,
        'java': LANGUAGES.JAVA
    };

    return extensionMap[ext] || LANGUAGES.JAVASCRIPT;
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language) {
    const displayNames = {
        [LANGUAGES.JAVASCRIPT]: 'JavaScript',
        [LANGUAGES.NODE]: 'Node.js',
        [LANGUAGES.PYTHON]: 'Python',
        [LANGUAGES.CPP]: 'C++',
        [LANGUAGES.C]: 'C',
        [LANGUAGES.JAVA]: 'Java'
    };

    return displayNames[language] || 'JavaScript';
}

/**
 * Get language icon
 */
export function getLanguageIcon(language) {
    const icons = {
        [LANGUAGES.JAVASCRIPT]: '📜',
        [LANGUAGES.NODE]: '🟢',
        [LANGUAGES.PYTHON]: '🐍',
        [LANGUAGES.CPP]: '⚙️',
        [LANGUAGES.C]: '🔧',
        [LANGUAGES.JAVA]: '☕'
    };

    return icons[language] || '📄';
}

/**
 * Get default filename for language
 */
export function getDefaultFilename(language) {
    const defaults = {
        [LANGUAGES.JAVASCRIPT]: 'index.js',
        [LANGUAGES.NODE]: 'index.js',
        [LANGUAGES.PYTHON]: 'main.py',
        [LANGUAGES.CPP]: 'main.cpp',
        [LANGUAGES.C]: 'main.c',
        [LANGUAGES.JAVA]: 'Main.java'
    };

    return defaults[language] || 'index.js';
}

/**
 * Get language file extensions
 */
export function getLanguageExtensions(language) {
    const extensions = {
        [LANGUAGES.JAVASCRIPT]: ['.js', '.mjs', '.cjs'],
        [LANGUAGES.NODE]: ['.js', '.mjs', '.cjs'],
        [LANGUAGES.PYTHON]: ['.py'],
        [LANGUAGES.CPP]: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
        [LANGUAGES.C]: ['.c', '.h'],
        [LANGUAGES.JAVA]: ['.java']
    };

    return extensions[language] || ['.js'];
}

/**
 * Check if file is executable for language
 */
export function isExecutableFile(filename, language) {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    const validExtensions = getLanguageExtensions(language);
    return validExtensions.includes(ext);
}

/**
 * Get run command suggestion
 */
export function getRunCommandSuggestion(projectInfo) {
    const { type, language, entryPoint } = projectInfo;

    switch (type) {
        case PROJECT_TYPES.NODE_PROJECT:
            return `node ${entryPoint}`;
        
        case PROJECT_TYPES.PYTHON_PROJECT:
            return `python ${entryPoint}`;
        
        case PROJECT_TYPES.CPP_PROJECT:
            return `g++ ${entryPoint} -o output && ./output`;
        
        case PROJECT_TYPES.JAVA_PROJECT:
            return `javac ${entryPoint} && java ${entryPoint.replace('.java', '')}`;
        
        case PROJECT_TYPES.SINGLE_FILE:
            switch (language) {
                case LANGUAGES.JAVASCRIPT:
                case LANGUAGES.NODE:
                    return `node ${entryPoint}`;
                case LANGUAGES.PYTHON:
                    return `python ${entryPoint}`;
                case LANGUAGES.CPP:
                    return `g++ ${entryPoint} -o output && ./output`;
                case LANGUAGES.C:
                    return `gcc ${entryPoint} -o output && ./output`;
                case LANGUAGES.JAVA:
                    return `javac ${entryPoint} && java ${entryPoint.replace('.java', '')}`;
                default:
                    return `node ${entryPoint}`;
            }
        
        default:
            return `node ${entryPoint}`;
    }
}
