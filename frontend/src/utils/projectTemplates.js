/**
 * Project Templates
 * Pre-configured templates for different languages
 */

export const TEMPLATES = {
    NODE_HELLO: {
        id: 'node_hello',
        name: 'Node.js Hello World',
        language: 'node',
        icon: '🟢',
        files: [
            {
                name: 'index.js',
                content: `console.log('Hello from Node.js!');

// Simple function
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
`
            }
        ]
    },

    NODE_EXPRESS: {
        id: 'node_express',
        name: 'Express.js Server',
        language: 'node',
        icon: '🟢',
        files: [
            {
                name: 'package.json',
                content: `{
  "name": "express-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
`
            },
            {
                name: 'server.js',
                content: `const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
`
            }
        ]
    },

    PYTHON_HELLO: {
        id: 'python_hello',
        name: 'Python Hello World',
        language: 'python',
        icon: '🐍',
        files: [
            {
                name: 'main.py',
                content: `print("Hello from Python!")

# Simple function
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
`
            }
        ]
    },

    PYTHON_FLASK: {
        id: 'python_flask',
        name: 'Flask Web App',
        language: 'python',
        icon: '🐍',
        files: [
            {
                name: 'requirements.txt',
                content: `Flask==2.3.0
`
            },
            {
                name: 'app.py',
                content: `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify(message='Hello from Flask!')

if __name__ == '__main__':
    print('Starting Flask server...')
    app.run(debug=True)
`
            }
        ]
    },

    CPP_HELLO: {
        id: 'cpp_hello',
        name: 'C++ Hello World',
        language: 'cpp',
        icon: '⚙️',
        files: [
            {
                name: 'main.cpp',
                content: `#include <iostream>
#include <string>

using namespace std;

string greet(string name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello from C++!" << endl;
    cout << greet("World") << endl;
    return 0;
}
`
            }
        ]
    },

    JAVA_HELLO: {
        id: 'java_hello',
        name: 'Java Hello World',
        language: 'java',
        icon: '☕',
        files: [
            {
                name: 'Main.java',
                content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        String greeting = greet("World");
        System.out.println(greeting);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
`
            }
        ]
    },

    EMPTY: {
        id: 'empty',
        name: 'Empty Project',
        language: 'node',
        icon: '📄',
        files: [
            {
                name: 'index.js',
                content: '// Start coding here...\n'
            }
        ]
    }
};

/**
 * Get all templates
 */
export function getAllTemplates() {
    return Object.values(TEMPLATES);
}

/**
 * Get templates by language
 */
export function getTemplatesByLanguage(language) {
    return Object.values(TEMPLATES).filter(t => t.language === language);
}

/**
 * Get template by ID
 */
export function getTemplateById(id) {
    return Object.values(TEMPLATES).find(t => t.id === id);
}

/**
 * Create project from template
 */
export function createProjectFromTemplate(templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    return {
        name: template.name,
        language: template.language,
        files: template.files.map(f => ({
            ...f,
            id: Math.random().toString(36).substr(2, 9)
        }))
    };
}
