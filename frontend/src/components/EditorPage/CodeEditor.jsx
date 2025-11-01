// CodeEditor.jsx
import { useEffect, useRef } from 'react';

const CodeEditor = () => {
  const editorRef = useRef(null);
  const monacoInstanceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.__MONACO_LOADED__ && window.monaco) {
      initializeEditor();
      return;
    }

    if (window.__MONACO_LOADING__) {
      const checkInterval = setInterval(() => {
        if (window.monaco) {
          clearInterval(checkInterval);
          initializeEditor();
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }

    window.__MONACO_LOADING__ = true;

    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
    loaderScript.async = true;
    loaderScript.onload = () => {
      window.require.config({
        paths: {
          vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
        }
      });

      window.require(['vs/editor/editor.main'], () => {
        window.__MONACO_LOADED__ = true;
        window.__MONACO_LOADING__ = false;
        initializeEditor();
      });
    };

    document.head.appendChild(loaderScript);

    function initializeEditor() {
      if (!containerRef.current || monacoInstanceRef.current) return;

      const code = `function hello() {
  console.log("Hello from Monaco!");
}

hello();
`;

      window.monaco.editor.defineTheme('vscode-dark-custom', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'regexp', foreground: 'D16969' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'class', foreground: '4EC9B0' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' },
          { token: 'constant', foreground: '4FC1FF' },
          { token: 'operator', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#D4D4D4',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#C6C6C6',
          'editor.lineHighlightBackground': '#2A2A2A',
          'editor.lineHighlightBorder': '#00000000',
          'editorCursor.foreground': '#AEAFAD',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorWhitespace.foreground': '#404040',
          'editorIndentGuide.background': '#404040',
          'editorIndentGuide.activeBackground': '#707070',
          'editor.findMatchBackground': '#515C6A',
          'editor.findMatchHighlightBackground': '#EA5C0055',
          'editor.wordHighlightBackground': '#575757B8',
          'editorBracketMatch.background': '#0064001A',
          'editorBracketMatch.border': '#888888',
        }
      });

      monacoInstanceRef.current = window.monaco.editor.create(containerRef.current, {
        value: code,
        language: 'javascript',
        theme: 'vscode-dark-custom',
        fontSize: 14,
        fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace',
        fontLigatures: true,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        minimap: {
          enabled: true,
          side: 'right',
          showSlider: 'mouseover',
          renderCharacters: true,
          maxColumn: 120
        },
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 14,
          horizontalScrollbarSize: 14,
          useShadows: false
        },
        automaticLayout: true,
        wordWrap: 'off',
        tabSize: 2,
        insertSpaces: true,
        renderWhitespace: 'selection',
        renderLineHighlight: 'all',
        renderLineHighlightOnlyWhenFocus: false,
        matchBrackets: 'always',
        folding: true,
        foldingStrategy: 'auto',
        showFoldingControls: 'mouseover',
        padding: {
          top: 16,
          bottom: 16
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: true,
        snippetSuggestions: 'inline',
        parameterHints: {
          enabled: true
        },
        formatOnPaste: true,
        formatOnType: true,
        glyphMargin: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 4,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        bracketPairColorization: {
          enabled: true
        }
      });
    }

    return () => {
      if (monacoInstanceRef.current) {
        monacoInstanceRef.current.dispose();
        monacoInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={editorRef}
      className="editor-wrapper"
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default CodeEditor;