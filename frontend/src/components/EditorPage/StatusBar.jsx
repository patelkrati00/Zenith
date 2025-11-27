import { GitBranch, RefreshCw, Bell, AlertCircle, AlertTriangle } from 'lucide-react';

const StatusBar = ({ language, cursorPosition, indentation }) => {

    const leftItems = [
        {
            icon: GitBranch,
            text: 'main',
            tooltip: 'main - Checkout branch/tag...',
            onClick: () => console.log('Git branch clicked')
        },
        {
            icon: RefreshCw,
            tooltip: 'Synchronize Changes',
            onClick: () => console.log('Sync clicked')
        },
        {
            icon: AlertCircle,
            text: '0',
            tooltip: '0 Errors',
            onClick: () => console.log('Errors clicked')
        },
        {
            icon: AlertTriangle,
            text: '0',
            tooltip: '0 Warnings',
            onClick: () => console.log('Warnings clicked')
        },
    ];

    const rightItems = [
        { text: 'Prettier', tooltip: 'Prettier', onClick: () => console.log('Prettier clicked') },
        { text: language , tooltip: 'Select Language Mode' },
        { text: 'UTF-8', tooltip: 'Select Encoding' },
        { text: 'CRLF', tooltip: 'Select End of Line Sequence' },
        {
            text: `Ln ${cursorPosition.line}, Col ${cursorPosition.col}`
            , tooltip: 'Go to Line/Column'
        },
        {
            text: indentation
            , tooltip: 'Select Indentation'
        },
        { icon: Bell, tooltip: 'Notifications' }
    ];

    const StatusBarItem = ({ item }) => {
        const Icon = item.icon;

        return (
            <button
                onClick={item.onClick}
                title={item.tooltip}
                className="
          flex items-center gap-[6px] px-[10px] h-full text-[12px] text-white 
          hover:bg-[#ffffff1a] transition-colors cursor-pointer select-none
        "
                style={{ fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace' }}
            >
                {Icon && <Icon size={14} strokeWidth={1.4} />}
                {item.text && <span className="whitespace-nowrap">{item.text}</span>}
                {item.count !== undefined && <span className="text-[11px]">{item.count}</span>}
            </button>
        );
    };

    return (
        <div
            className="flex items-center justify-between w-full bg-[#1e1e1e] border-t border-[#3c3c3c]"
            style={{
                height: '22px',
                fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace'
            }}
        >
            {/* Left Section */}
            <div className="flex items-center h-full bg-[#1e1e1e]">
                {leftItems.map((item, index) => (
                    <div key={index} className="flex items-center h-full">
                        <StatusBarItem item={item} />
                        {index < leftItems.length - 1 && (
                            <div className="w-[1px] h-[14px] bg-[#3c3c3c]" />
                        )}
                    </div>
                ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center h-full bg-[#1e1e1e]">
                {rightItems.map((item, index) => (
                    <div key={index} className="flex items-center h-full">
                        {index > 0 && <div className="w-[1px] h-[14px] bg-[#3c3c3c]" />}
                        <StatusBarItem item={item} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusBar;
