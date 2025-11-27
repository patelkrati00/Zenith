import { useEffect, useRef } from 'react';

const CodeEditor = ({ 
  onCursorChange, 
  onIndentChange, 
  onLanguageChange,
  onCodeChange
}) => {

  const monacoInstanceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {

    function initializeEditor() {
      if (!containerRef.current || monacoInstanceRef.current) return;

      const code = `function hello() {
  console.log("Hello from Monaco!");
}

hello();
`;

      const monaco = window.monaco;

      // ✅ THEME
      monaco.editor.defineTheme("vscode-dark-custom", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#1e1e1e"
        },
      });

      // ✅ CREATE EDITOR
      const editor = monaco.editor.create(containerRef.current, {
        value: code,
        language: "javascript",
        theme: "vscode-dark-custom",
        fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
        fontSize: 14,
        automaticLayout: true,
      });

      monacoInstanceRef.current = editor;

      // ✅ Initial code value
      onCodeChange?.(editor.getValue());

      // ✅ Code change listener
      editor.onDidChangeModelContent(() => {
        onCodeChange?.(editor.getValue());
      });

      // ✅ Cursor Update
      editor.onDidChangeCursorPosition(() => {
        const pos = editor.getPosition();
        onCursorChange?.({
          line: pos.lineNumber,
          col: pos.column,
        });
      });

      // ✅ Language Update
      onLanguageChange?.(editor.getModel().getLanguageId());
      monaco.editor.onDidCreateModel((m) => {
        onLanguageChange?.(m.getLanguageId());
      });

      // ✅ Indentation / Tab Size Update
      const tabSize = editor.getModel().getOptions().tabSize;
      onIndentChange?.(`Spaces: ${tabSize}`);

      editor.onDidChangeModelOptions(() => {
        const newTabSize = editor.getModel().getOptions().tabSize;
        onIndentChange?.(`Spaces: ${newTabSize}`);
      });
    }

    // ✅ Load Monaco properly
    if (window.__MONACO_LOADED__ && window.monaco) {
      initializeEditor();
      return;
    }

    if (!window.__MONACO_LOADING__) {
      window.__MONACO_LOADING__ = true;
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
      script.onload = () => {
        window.require.config({
          paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" },
        });

        window.require(["vs/editor/editor.main"], () => {
          window.__MONACO_LOADED__ = true;
          initializeEditor();
        });
      };
      document.body.appendChild(script);
    }

  }, [onCursorChange, onIndentChange, onLanguageChange, onCodeChange]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#1e1e1e" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default CodeEditor;
